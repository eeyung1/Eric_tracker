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
 if (error?.status === 402) return 'This lesson requires an active learning plan.';
 return 'The tutor could not connect. Please try again.';
}
