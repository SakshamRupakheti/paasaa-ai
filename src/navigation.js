export const screenForHash = hash => hash === '#check-in' ? 'transition-screen' : hash === '#finish' ? 'finish-screen' : 'breathing-screen';
export const hashForScreen = screen => ['transition-screen','reflection-screen'].includes(screen) ? '#check-in' : screen === 'finish-screen' ? '#finish' : '#breathe';
