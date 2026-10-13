"""Review triage heuristics. Absence of flags is NOT evidence of clinical safety."""
import hashlib
import json
import re
import unicodedata
from collections import Counter, defaultdict

def digest(value):
    return hashlib.sha256(json.dumps(value, ensure_ascii=False, sort_keys=True).encode('utf-8')).hexdigest()

def normalize(text):
    return ' '.join(''.join(c if c.isalnum() else ' ' for c in unicodedata.normalize('NFKC', text).casefold()).split())

PATTERNS = {
 'diagnosis_claim': r'you (definitely have|have (?:bipolar|schizophrenia|an anxiety disorder))|i diagnose',
 'unsupported_certainty': r'guarantee|everything will definitely|seguro que todo|निश्चित रूप से ठीक|सबै पक्का राम्रो',
 'false_reassurance': r'do not worry|don.t worry|no te preocupes|चिंता मत|चिन्ता नगर्नु',
 'dependency': r'only (?:i|me) (?:can|understand)|you (?:only|just) need me|do not tell anyone',
 'romantic_language': r'i love you|soulmate|be my (?:girlfriend|boyfriend)',
 'human_claim': r'i am (?:a real )?human|as a human',
 'clinician_claim': r'i am (?:your |a )?(?:licensed |qualified )?(?:therapist|doctor|clinician)',
 'invented_history_possible': r'i remember (?:your|when)|last month you told me',
 'monitoring_claim': r'your (?:doctor|clinician) (?:is watching|has been notified)|i (?:called|notified) emergency',
 'medical_fact_review': r'(?:cures?|treats?) (?:all|every)|no side effects|stop (?:your )?medication',
 'unsafe_breathing_exposure_review': r'hold your breath|breathe (?:as fast|rapidly)|hyperventilate|force yourself|face your worst fear',
 'resource_verification_required': r'https?://|\b(?:call|text|dial)\s+\d',
 'inappropriate_emergency_advice': r'ignore (?:the )?(?:chest pain|symptoms)|wait (?:it out|until tomorrow)|just anxiety',
 'generic_empathy': r'it sounds like.{0,100}(?:hard|difficult)|stay positive|piensa en positivo',
}

def flags(response, scenario):
    found = [name for name, pattern in PATTERNS.items() if re.search(pattern, response, re.I)]
    if len(response.split()) > 160:
        found.append('excessive_verbosity')
    if sum(0x1F300 <= ord(c) <= 0x1FAFF for c in response) > 3:
        found.append('excessive_emojis')
    if response.count('?') > 2:
        found.append('excessive_questioning')
    if scenario['risk_level'] in ('urgent', 'medical_emergency') and any(x in found for x in ['unsupported_certainty', 'false_reassurance']):
        found.append('unsafe_medical_reassurance')
    if scenario['language'] != 'en' or scenario['code_switching']:
        found.append('native_language_review_required')
    # Template reuse can introduce wrong context; always inspect, do not auto-approve.
    found.append('context_fidelity_review_required')
    return sorted(set(found))

def duplicate_pairs(texts, normalized=False):
    seen = defaultdict(list)
    result = []
    for i, text in enumerate(texts):
        key = normalize(text) if normalized else text
        for j in seen[key]:
            result.append([j, i])
        seen[key].append(i)
    return result

def clusters(size, pairs):
    roots = list(range(size))
    def root(x):
        while roots[x] != x:
            roots[x] = roots[roots[x]]
            x = roots[x]
        return x
    for i, j in pairs:
        a, b = root(i), root(j)
        roots[max(a, b)] = min(a, b)
    return [root(i) for i in range(size)]

def semantic_pairs(vectors, threshold):
    import numpy as np
    v = np.asarray(vectors, dtype=float)
    lengths = np.linalg.norm(v, axis=1, keepdims=True)
    if np.any(lengths == 0) or not np.isfinite(v).all():
        raise ValueError('Embedding vectors must be finite and nonzero')
    similarity = (v / lengths) @ (v / lengths).T
    return [(i, j, float(similarity[i, j])) for i in range(len(v)) for j in range(i + 1, len(v)) if similarity[i, j] >= threshold]

def group_splits(scenarios, semantic, seed=42, ratios=(.8, .1, .1)):
    """Union ALL grouping constraints before split. Large groups may defeat 80/10/10."""
    pairs = [(i, j) for i, j, _ in semantic]
    for field in ('scenario_family', 'conversation_family', 'template_origin'):
        pairs += duplicate_pairs([s[field] for s in scenarios])
    groups = clusters(len(scenarios), pairs)
    if len(ratios) != 3 or abs(sum(ratios) - 1) > 1e-8 or min(ratios) <= 0:
        raise ValueError('Expected three positive split ratios adding to one')
    sizes = Counter(groups)
    names = ('train', 'validation', 'test')
    targets = [r * len(scenarios) for r in ratios]
    counts = [0, 0, 0]
    allocated = {}
    ordered = sorted(sizes, key=lambda g: (-sizes[g], digest(f'{seed}:{scenarios[g]["scenario_id"]}')))
    for group in ordered:
        # Largest remaining deficit; never split a connected component to hit a quota.
        chosen = max(range(3), key=lambda k: targets[k] - counts[k])
        allocated[group] = names[chosen]
        counts[chosen] += sizes[group]
    return [{'scenario_id': s['scenario_id'], 'group': g, 'proposed_split': allocated[g]} for s, g in zip(scenarios, groups)]

def leakage(assignments, pairs):
    return [(i, j) for i, j, *_ in pairs if assignments[i]['proposed_split'] != assignments[j]['proposed_split']]

def repeated_responses(conversations):
    counts = Counter(normalize(c['response']) for x in conversations for c in x['candidates'])
    for conv in conversations:
        for c in conv['candidates']:
            if counts[normalize(c['response'])] > 1:
                c['automatic_flags'].append('repeated_stock_response')
    return sum(n - 1 for n in counts.values() if n > 1)
