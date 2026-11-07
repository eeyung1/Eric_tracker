// Pure UI adapter: the Go tutor is the only authority for lesson state.
export function tutorView(response) {
 if (!response || typeof response !== 'object') throw new TypeError('Invalid tutoring response');
 const state = response.state;
 if (typeof state !== 'string' || state.length > 80) throw new TypeError('Missing tutoring state');
 const prompt = typeof response.prompt === 'string' ? response.prompt : (typeof response.currentQuestion === 'string' ? response.currentQuestion : '');
 return {
  state,
  prompt,
  completed: state === 'mastered',
  canAnswer: !['mastered','idle'].includes(state),
 };
}

export function tutorErrorMessage(error) {
 if (error?.status === 401 || error?.status === 403) return 'Your learning session needs authorization. Please sign in again.';
 if (error?.status === 402) return 'This lesson needs a guardian-approved learning plan. Ask your mentor to help.';
 if (error?.status === 429) return 'You have made several requests. Wait a little before trying again.';
 if (error?.status === 503 || error?.status === 502 || error?.status === 504) return 'SoTeach is temporarily unavailable. Your typed answer is safe; try Resume before sending again.';
 if (error?.status === 400) return 'Check your lesson details or answer and try again.';
 return 'The tutor could not connect. Please try again.';
}
