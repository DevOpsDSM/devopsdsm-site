# devopsdsm-site
Simple website for DevOpsDSM with links and redirects to X, LinkedIn, and Meetup pages.

We have a Github workflow connected to our AWS Account 211125611494 which has triggers on certain files under paths.
For development, you can modify the branches which these triggers go off of to have Github actions run after pushes to that branch rather than only to main branch.

In the workflow it configures AWS Credentials and runs CDK commands to deploy materials we have in the cdk directory. 

CDK Directory includes a stack for the S3 bucket which allows public access, designates the website index document (index.html), a resource policy, as well as uploads all files from app/ to the S3 bucket.

APP Directory hosts the HTML files for the Static website, containing some links to the DevOpsDSM X, LinkedIn, and Meetup page.