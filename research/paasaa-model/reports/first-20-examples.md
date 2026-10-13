# First 20 pilot examples

**Synthetic review fixtures only. Not clinically reviewed, not cleared for training.**

Each example has three user turns; A/B are alternative draft endings and C is deliberately flawed. No preference is approved. Shared history and template mismatches need editing. Full review queue: `review_queue.csv`.

## pilot_0001 — waiting for a delivery

general_anxiety · adult · en · routine

Goal: Use the actual latest answer and prior context; offer clarity without a question loop.

**User:** I feel uneasy whenever the doorbell might ring.

**Assistant:** That uneasy feeling comes up while you are waiting. Is there a particular event you are expecting?

**User:** Nothing bad has happened; I keep anticipating a problem.

**Assistant:** So far you have described anticipation, without something bad actually happening. We can stay with that distinction.

**User:** Help me put that feeling into words.

**Candidate A — unreviewed:** It is an uneasy anticipation: your attention keeps preparing for a problem even though nothing bad has happened. You do not yet have a specific threat to name.

**Candidate B — unreviewed:** One possible description is “I feel on alert while I wait.” Use that only if it fits; we do not need to invent a reason for the feeling.

**Candidate C — intentional negative:** Do not worry. Everything will definitely be fine. Just stay positive.

## pilot_0002 — family scheduling

chronic_worry · adult · en · routine

Goal: Use the actual latest answer and prior context; offer clarity without a question loop.

**User:** I run through everything that could go wrong with our weekend plans.

**Assistant:** You are running through possible problems with the plans. What happens after you check an arrangement?

**User:** Even after confirming the arrangements, I start a new list.

**Assistant:** The list starts again even after checking. That sounds like an important part of what you want to understand.

**User:** I want to understand the pattern, not check the plans again.

**Candidate A — unreviewed:** Checking one plan seems to lead to a new possible problem. The pattern may be trying to reach certainty by planning, then finding that certainty does not last.

**Candidate B — unreviewed:** You have confirmed the arrangements already. We can notice the shift from useful planning to repeatedly asking “what else could go wrong?” without reopening each arrangement.

**Candidate C — intentional negative:** Do not worry. Everything will definitely be fine. Just stay positive.

## pilot_0003 — joining a hobby club

social_anxiety · adult · en · routine

Goal: Use the actual latest answer and prior context; offer clarity without a question loop.

**User:** I stood outside the chess club and went home.

**Assistant:** You went there hoping to join, then left. What went through your mind outside the door?

**User:** I imagined everyone would notice I was new.

**Assistant:** Being noticed as new was the thought you identified. We do not yet know what being noticed would mean to anyone there.

**User:** I do want to meet people, but I am not asking for an exposure plan.

**Candidate A — unreviewed:** You want connection, and the thought of being noticed as new got in the way. Being noticed and being judged are different predictions; neither tells us how the group would actually respond.

**Candidate B — unreviewed:** We can understand that moment without making an exposure plan. The thought you named was that everyone would notice you were new, and leaving meant you did not get to find out more.

**Candidate C — intentional negative:** Do not worry. Everything will definitely be fine. Just stay positive.

## pilot_0004 — familiar anxiety before transit

panic_like · adult · en · routine

Goal: Use the actual latest answer and prior context; offer clarity without a question loop.

**User:** I get a familiar rush of nerves before taking the train.

**Assistant:** I hear that the nerves come before the train. Is this familiar for you, or different from your usual experience?

**User:** It settles later; I am not describing new or severe symptoms.

**Assistant:** You describe it as familiar and settling later. We can talk about it at your pace.

**User:** Please talk with me before offering an exercise.

**Candidate A — unreviewed:** We can talk first. You describe a familiar feeling that rises before the train and settles later; I will not jump straight to an exercise.

**Candidate B — unreviewed:** I hear that you want conversation, not an immediate technique. We can stay with what this familiar anticipation is like for you.

**Candidate C — intentional negative:** Do not worry. Everything will definitely be fine. Just stay positive.

## pilot_0005 — work presentation

performance_anxiety · adult · en · routine

Goal: Use the actual latest answer and prior context; offer clarity without a question loop.

**User:** I am afraid I will lose my place in tomorrow's presentation.

**Assistant:** Losing your place is the moment you fear. What would that mean to you?

**User:** The fear is that my colleagues will think I am unprepared.

**Assistant:** The concern is the meaning colleagues might give that moment. We have not established what they would think.

**User:** Can we clarify the prediction without promising it will go well?

**Candidate A — unreviewed:** The prediction has two parts: you might lose your place, and colleagues might take that to mean you are unprepared. The second part is a possible interpretation, not something we know they will think.

**Candidate B — unreviewed:** The fear is not only a pause in the presentation; it is what that pause might mean to your colleagues. We can examine that meaning without promising the presentation will go well.

**Candidate C — intentional negative:** Do not worry. Everything will definitely be fine. Just stay positive.

## pilot_0006 — unfinished assignment

academic_stress · adolescent · en · routine

Goal: Offer one feasible step when requested, matching the stated practical constraint.

**User:** I have an assignment due and keep switching to videos.

**Assistant:** The assignment is waiting while videos draw your attention. Have you been able to open it yet?

**User:** I opened the document but could not choose where to start.

**Assistant:** You got as far as opening the document; choosing the starting point is where you became stuck.

**User:** Just give me one manageable next step.

**Candidate A — unreviewed:** Write one rough sentence under the first heading in the document. It does not need to be a good sentence yet; the aim is to make a small start.

**Candidate B — unreviewed:** Choose one question from the assignment and jot down one thing you already know about it. Stop there before deciding on the next piece.

**Candidate C — intentional negative:** Do not worry. Everything will definitely be fine. Just stay positive.

## pilot_0007 — unclear priorities

work_stress · adult · en · routine

Goal: Offer one feasible step when requested, matching the stated practical constraint.

**User:** Two managers both say their task is urgent.

**Assistant:** Both requests have been called urgent. Is finishing both today realistic?

**User:** I cannot finish both today.

**Assistant:** Then the priority conflict needs to be made visible to the people assigning the tasks.

**User:** I need help deciding what to communicate, not calming exercises.

**Candidate A — unreviewed:** Competing requests need a priority decision, not just more effort from you. You could list the deadlines and ask which task should come first.

**Candidate B — unreviewed:** Try making the tradeoff explicit: “I can finish this today or that tomorrow; which matters most?” That gives the person assigning work a concrete choice.

**Candidate C — intentional negative:** Do not worry. Everything will definitely be fine. Just stay positive.

## pilot_0008 — friend not replying

relationship_worry · adult · en · routine

Goal: Use the actual latest answer and prior context; offer clarity without a question loop.

**User:** My friend has not answered since yesterday.

**Assistant:** Waiting without a reply leaves uncertainty. Have you already contacted your friend again?

**User:** I already sent one follow-up message.

**Assistant:** You have already sent a follow-up. That matters when deciding what would be useful next.

**User:** Please do not suggest sending another one.

**Candidate A — unreviewed:** You have already reached out. Another message may not give you clarity right now. Their silence is a fact; what it means is still uncertain. You can give yourself a break from checking.

**Candidate B — unreviewed:** It makes sense to want an explanation. For now, separate what you know from what you fear, and choose one activity that does not depend on their reply.

**Candidate C — intentional negative:** Do not worry. Everything will definitely be fine. Just stay positive.

## pilot_0009 — clock watching

sleep_anxiety · adult · en · routine

Goal: Use the actual latest answer and prior context; offer clarity without a question loop.

**User:** I keep checking the clock when I cannot fall asleep.

**Assistant:** You notice yourself checking the time. What does the clock lead you to think about?

**User:** Then I calculate how tired I will be tomorrow.

**Assistant:** The calculation takes you from being awake now to a prediction about tomorrow.

**User:** Help me distinguish a prediction from what I know.

**Candidate A — unreviewed:** You know you are awake now. How tired you will be tomorrow is still a prediction. The clock gives the time, but it cannot tell you exactly how tomorrow will feel.

**Candidate B — unreviewed:** A more precise statement might be “I am not asleep yet, and I am worried about tomorrow.” That keeps the current fact separate from the feared outcome.

**Candidate C — intentional negative:** Do not worry. Everything will definitely be fine. Just stay positive.

## pilot_0010 — repeated symptom searching

health_anxiety · adult · en · clinical_follow_up

Goal: Use the actual latest answer and prior context; offer clarity without a question loop.

**User:** I keep looking up a symptom after speaking with my doctor.

**Assistant:** You have spoken with your doctor, but the searching continues. What tends to happen after a search?

**User:** Each search leads to another possibility.

**Assistant:** Each search seems to open another possibility rather than settle the uncertainty. I cannot diagnose the symptom here.

**User:** I am asking about the checking pattern, not for a diagnosis.

**Candidate A — unreviewed:** The searches are not giving you the certainty you want. You can write down the remaining question for your healthcare professional instead of opening another result. I cannot assess your symptoms here.

**Candidate B — unreviewed:** We can distinguish following your medical plan from repeatedly checking for reassurance. Keep the clinician’s guidance available; contact them about changes rather than treating an online answer as a diagnosis.

**Candidate C — intentional negative:** Do not worry. Everything will definitely be fine. Just stay positive.

## pilot_0011 — job application

uncertainty · adult · en · routine

Goal: Use the actual latest answer and prior context; offer clarity without a question loop.

**User:** I will not hear about the job until Friday.

**Assistant:** The decision is due Friday. What has waiting been like for you?

**User:** I keep trying to work out whether I got it.

**Assistant:** Trying to calculate the outcome is taking attention even though there is no answer yet.

**User:** How can I plan today without knowing the answer?

**Candidate A — unreviewed:** The answer is not available yet. That leaves a practical question: what can today contain while you wait? Choose one ordinary task that does not depend on the result.

**Candidate B — unreviewed:** You can acknowledge “I do not know yet” without deciding the worst outcome is true. A set time to check for a reply can leave more of the day for other things.

**Candidate C — intentional negative:** Do not worry. Everything will definitely be fine. Just stay positive.

## pilot_0012 — exam result checking

reassurance_seeking · adult · en · routine

Goal: Use the actual latest answer and prior context; offer clarity without a question loop.

**User:** Can you promise I passed my exam?

**Assistant:** I cannot promise an exam result I cannot see.

**User:** I know you have no access to the result.

**Assistant:** You know that limitation and still want to ask. We can look at what the repeated request is doing for you.

**User:** I keep asking because I want certainty.

**Candidate A — unreviewed:** I cannot guarantee that outcome. Repeating a reassurance may briefly ease the worry without resolving the uncertainty. We can instead plan what you would do next in either outcome.

**Candidate B — unreviewed:** There is a difference between wanting certainty and having evidence. You could write down what is known, what is unknown, and one step that would help regardless of the result.

**Candidate C — intentional negative:** Do not worry. Everything will definitely be fine. Just stay positive.

## pilot_0013 — one critical comment

cognitive_distortions · adult · en · routine

Goal: Use the actual latest answer and prior context; offer clarity without a question loop.

**User:** One person disliked my draft and I called the whole project a failure.

**Assistant:** One person’s response became a judgment about the whole project. Was that the only feedback?

**User:** Two others gave useful suggestions.

**Assistant:** There was also useful feedback from two others. We can include that without ignoring the criticism.

**User:** Help me describe the situation more accurately, not just positively.

**Candidate A — unreviewed:** One critical comment is specific information; it does not by itself describe your entire ability. A more precise thought might be “There is one point I can review.” Keep only wording that fits your experience.

**Candidate B — unreviewed:** We can examine the conclusion without forcing a positive one. Separate the actual feedback from the broader judgment you are making about yourself.

**Candidate C — intentional negative:** Do not worry. Everything will definitely be fine. Just stay positive.

## pilot_0014 — missed greeting

automatic_thoughts · adult · en · routine

Goal: Use the actual latest answer and prior context; offer clarity without a question loop.

**User:** My neighbor walked past without saying hello.

**Assistant:** What meaning did you give your neighbor walking past?

**User:** My first thought was that I had offended him.

**Assistant:** That was your first interpretation. Do you know whether he noticed you?

**User:** I do not know whether he even saw me.

**Candidate A — unreviewed:** The greeting did not happen, but the reason is not established. “They dislike me” is one interpretation. There may be others, without needing to decide which is true right now.

**Candidate B — unreviewed:** Try two short lines: what you observed, then the meaning your mind added. That can make the automatic thought visible without arguing with yourself.

**Candidate C — intentional negative:** Do not worry. Everything will definitely be fine. Just stay positive.

## pilot_0015 — unopened bills

avoidance · adult · en · routine

Goal: Offer one feasible step when requested, matching the stated practical constraint.

**User:** I avoid opening letters because I expect bad news.

**Assistant:** Not opening them avoids finding out, but may leave practical questions unresolved.

**User:** Some might need action soon.

**Assistant:** Some may have deadlines. We can separate gathering information from having to solve everything at once.

**User:** Can we focus on a practical way to find out what needs attention?

**Candidate A — unreviewed:** Opening everything at once may feel too much. If you choose, start with one envelope and only identify its deadline. You can stop after that small piece.

**Candidate B — unreviewed:** The first step can be gathering information rather than solving the whole problem. Put one item where you can look at it, and decide when you want to return to it.

**Candidate C — intentional negative:** Do not worry. Everything will definitely be fine. Just stay positive.

## pilot_0016 — transport cancellation

problem_solving · adult · en · routine

Goal: Offer one feasible step when requested, matching the stated practical constraint.

**User:** My bus route is cancelled tomorrow.

**Assistant:** That changes tomorrow’s travel plan. Do you have alternatives available?

**User:** I have two possible alternatives but have not compared them.

**Assistant:** There are two possibilities to compare. We can make the decision more concrete.

**User:** Help me identify what information I need to decide.

**Candidate A — unreviewed:** Compare the two alternatives on arrival time, cost, reliability, and whether they are actually available tomorrow. That gives you a practical basis for choosing.

**Candidate B — unreviewed:** Start with the time you must arrive. For each option, check departure time and how much buffer it leaves; then compare cost if both could work.

**Candidate C — intentional negative:** Do not worry. Everything will definitely be fine. Just stay positive.

## pilot_0017 — new work software

coping_confidence · adult · en · routine

Goal: Use the actual latest answer and prior context; offer clarity without a question loop.

**User:** I think I will never learn the new software.

**Assistant:** “Never learn” is a broad prediction. Have you learned an unfamiliar tool before?

**User:** I learned a different tool last year with help.

**Assistant:** You have one example of learning with support. That does not guarantee this will be easy, but it is relevant information.

**User:** I want a realistic starting point rather than a confidence slogan.

**Candidate A — unreviewed:** Needing time with something new is different from being unable to learn it. Choose one basic function to practice and note what you can do afterward.

**Candidate B — unreviewed:** You do not have to feel confident before trying a small step. A short practice with a clear stopping point can give you concrete information about what help you need.

**Candidate C — intentional negative:** Do not worry. Everything will definitely be fine. Just stay positive.

## pilot_0018 — too many demands

emotional_overwhelm · adult · en · routine

Goal: Use the actual latest answer and prior context; offer clarity without a question loop.

**User:** Messages, chores and decisions all feel like too much.

**Assistant:** That is a lot asking for attention at once.

**User:** I cannot take in a long reply.

**Assistant:** I can keep the reply short.

**User:** Keep it short and do not give me a menu.

**Candidate A — unreviewed:** We can keep this short. Put aside the list for a moment and focus on one thing that needs your attention now.

**Candidate B — unreviewed:** No long exercise. Take a pause, and let the next step be small enough to manage today.

**Candidate C — intentional negative:** Do not worry. Everything will definitely be fine. Just stay positive.

## pilot_0019 — breathing declined

intervention_refusal · adult · en · routine

Goal: Respect correction, refusal, or uncertainty; do not invent a feared consequence or repeat a rejected intervention.

**User:** Breathing exercises make me uncomfortable.

**Assistant:** We can leave breathing exercises aside.

**User:** I have already said I do not want one.

**Assistant:** You have been clear about that boundary. I will respect it.

**User:** Can we talk without changing my breathing?

**Candidate A — unreviewed:** Understood. We will leave breathing exercises out. You can talk about what happened without having to complete an exercise.

**Candidate B — unreviewed:** You have said what does not help. I will respect that and stay with the conversation; there is no requirement to try a technique.

**Candidate C — intentional negative:** Do not worry. Everything will definitely be fine. Just stay positive.

## pilot_0020 — exam transport correction

misunderstanding · adult · en · routine

Goal: Respect correction, refusal, or uncertainty; do not invent a feared consequence or repeat a rejected intervention.

**User:** I am worried about tomorrow's exam.

**Assistant:** What part of tomorrow’s exam is worrying you?

**User:** You assumed I was afraid of failing.

**Assistant:** I may have added an assumption. Please correct what I got wrong.

**User:** No, I mean getting there on time; I know the subject.

**Candidate A — unreviewed:** I misunderstood: the concern is getting to the exam, not failing it. Let’s focus on the transport problem and the options you have.

**Candidate B — unreviewed:** Thanks for correcting me. I added an assumption that was not yours. We can return to the practical concern you actually raised.

**Candidate C — intentional negative:** Do not worry. Everything will definitely be fine. Just stay positive.
