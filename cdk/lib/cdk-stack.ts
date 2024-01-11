import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Bucket, BucketEncryption, ObjectOwnership } from 'aws-cdk-lib/aws-s3';
import { BucketDeployment, Source } from "aws-cdk-lib/aws-s3-deployment";
import { PolicyStatement, ArnPrincipal } from 'aws-cdk-lib/aws-iam';

export class CdkStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: cdk.StackProps) {
    super(scope, id, props as Record<string, unknown>);

    const bucket = new Bucket(this, 'devopsdsm-bucket', {
      bucketName: 'devopsdsm-site-bucket',
      encryption: BucketEncryption.S3_MANAGED,
      websiteIndexDocument: 'index.html',
      objectOwnership: ObjectOwnership.OBJECT_WRITER,
      publicReadAccess: true,
	    blockPublicAccess: {
		    blockPublicPolicy: false,
		    blockPublicAcls: false,
		    ignorePublicAcls: false,
		    restrictPublicBuckets: false,
	},
    });

    new BucketDeployment(this, 'devopsdsm-bucket-deployment', {
      sources: [Source.asset('./app')],
      destinationBucket: bucket,
    });

  }
}
