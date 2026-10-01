export const screenForHash = hash => hash === '#support' ? 'support-screen' : hash === '#check-in' ? 'transition-screen' : hash === '#finish' ? 'finish-screen' : 'breathing-screen';
export const hashForScreen = screen => screen === 'support-screen' ? '#support' : ['transition-screen','reflection-screen'].includes(screen) ? '#check-in' : screen === 'finish-screen' ? '#finish' : '#breathe';
