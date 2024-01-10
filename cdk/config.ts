export const config: Record<string, unknown> = {
    app: {
        env: {
            account: process.env.AWS_ACCOUNT,
            region: process.env.AWS_REGION
        }
    },

    Development: {
        environment: 'Development',
        bucketName: 'devopsdsm-s3-bucket',
        repo: 'https://github.com/DevOpsDSM/devopsdsm-site'
    }


}