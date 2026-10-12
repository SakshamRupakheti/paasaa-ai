// Static illustrative previews, never real patient messages or invented features.
export function renderLanding(root){
  document.body.classList.add('scenic-home');
  root.innerHTML=`
    <section class="scenic-hero" aria-labelledby="scenic-title">
      <div class="hero-copy"><p class="nature-eyebrow">YOUR BEST SPACE</p>
        <h1 id="scenic-title">Welcome to Paasaa.</h1>
        <p class="hero-description">A little space for you.<br> An AI companion for everyday worries, reflection, and calmer moments.</p>
        <div class="hero-links"><a class="nature-button" href="#chat">Start chatting <span aria-hidden="true">↗</span></a><a class="nature-button outline" href="#breathe">Feel calmer</a></div>
        <p class="hero-reassurance">Come as you are. Take it at your own pace.</p>
        <a class="hero-guest" href="#account">Sign in to save, or explore as a guest →</a>
      </div>
      <div class="hero-caption"><span>Inspired by the Himalayas</span><a href="#help">AI self-help prototype · Ages 13+</a></div>
    </section>
    <section class="nature-feature" aria-labelledby="talk-feature">
      <div class="feature-copy"><p class="nature-eyebrow">A LITTLE SPACE, ANYTIME</p><h2 id="talk-feature">Talk about<br> what’s on<br> your mind.</h2><p>Big feelings, small worries, or a day you want to talk through. Start wherever you are.</p>
        <ul class="nature-benefits"><li><span aria-hidden="true">◌</span>A conversation at your pace</li><li><span aria-hidden="true">❧</span>Space to reflect, one step at a time</li><li><span aria-hidden="true">♧</span>Guest mode without saved activity</li></ul>
        <a class="nature-text-link" href="#chat">Meet your companion →</a></div>
      <div class="product-preview" aria-label="Illustrative chat preview">
        <div class="preview-side"><span class="preview-brand">Paasaa.ai</span><span class="preview-nav selected">◌ &nbsp; Chat</span><span class="preview-nav">☼ &nbsp; Check-in</span><span class="preview-nav">▥ &nbsp; Progress</span><span class="preview-nav">♡ &nbsp; Help</span><small>your best space</small></div>
        <div class="preview-chat"><div class="preview-top"><span>Talk to Paasaa</span><span class="preview-label">Example conversation</span></div>
          <p class="preview-message from-you">I’ve had a lot on my mind today.</p>
          <div class="preview-answer"><span aria-hidden="true">❧</span><p>We can take it one thing at a time. What’s been taking up the most space?</p></div>
          <p class="preview-message from-you">I keep going over a conversation I had.</p>
          <div class="preview-answer"><span aria-hidden="true">❧</span><p>What part of that conversation keeps coming back to you?</p></div>
          <a class="preview-composer" href="#chat"><span>Start your own conversation…</span><span class="preview-send" aria-hidden="true">↑</span></a>
        </div>
      </div>
    </section>
    <section class="nature-feature checkin-feature" aria-labelledby="checkin-feature">
      <div class="feature-copy"><p class="nature-eyebrow">DAILY CHECK-IN</p><h2 id="checkin-feature">A kinder way to<br> check in with yourself.</h2><p>A moment to notice how you feel, reflect on your day, and make room for yourself.</p><a class="nature-text-link" href="#check-in">Take a moment →</a></div>
      <div class="checkin-preview"><div class="preview-top"><span class="preview-brand">Daily check-in</span><span class="preview-label">A look inside</span></div><p>A small pause, just for you.</p><h3>How are you feeling today?</h3><div class="preview-moods"><span>🙂<small>Good</small></span><span>😐<small>Okay</small></span><span>😟<small>Anxious</small></span><span>😔<small>Low</small></span><span>🤔<small>Not sure</small></span></div><h3>What’s on your mind?</h3><p class="preview-note">A thought, a feeling, or nothing at all.</p><a class="nature-button" href="#check-in">Try a check-in <span aria-hidden="true">→</span></a></div>
    </section>
    <section class="nature-closing"><p class="nature-eyebrow">ONE SMALL STEP</p><h2>You don’t have to figure it all out today.</h2><a class="nature-button" href="#account">Find your space <span aria-hidden="true">→</span></a><p>Paasaa is an AI self-help prototype, not a therapist. Chats are not continuously monitored.</p><a class="nature-text-link" href="#help">Privacy, safety & support →</a></section>`;
}
