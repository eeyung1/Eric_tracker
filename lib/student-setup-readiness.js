// Never return credential values, learner IDs or external keys to a browser.
export function studentSetupReadiness(env=process.env) {
 const credentials=Boolean(env.ERIC_STUDENT_PASSWORD_HASH?.startsWith('scrypt$') && env.STUDENT_SESSION_SECRET?.length>=32);
 const tutor=Boolean(env.SOTEACH_PRIVATE_URL && env.SOTEACH_SERVICE_TOKEN?.length>=32 && env.SOTEACH_GUARDIAN_TOKEN && env.ERIC_TUTOR_LEARNER_ID);
 return {credentialsConfigured:credentials,tutorTransportConfigured:tutor,ready:credentials&&tutor};
}
