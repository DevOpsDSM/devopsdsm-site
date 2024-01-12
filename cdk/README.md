# Welcome to your CDK TypeScript project

This hosts our CDK files for managing AWS Resources such as the S3 bucket.
`bin/cdk.ts` initializes the CDK project and creates a cdk-stack
`lib/cdk-stack` creates the S3 bucket along with a bucket policy and uploades the HTML files

We have all CDK commands hosted in the Github workflow which runs dependind on triggers at the top of the workflow file.

`cdk bootstrap` initializes and configures the AWS CDK environment which we deploy serivices to.
`cdk diff` provides differences between the currently deployed stack and the current local CDK files.
`cdk synth` creates a CloudFormation template of all the resources in CDK files.
`cdk deploy` deployes the template with resources to AWS.