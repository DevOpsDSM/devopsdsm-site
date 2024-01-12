import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Bucket, BucketEncryption, ObjectOwnership } from 'aws-cdk-lib/aws-s3';
import { BucketDeployment, Source } from "aws-cdk-lib/aws-s3-deployment";
import { AccountPrincipal, PolicyStatement, } from 'aws-cdk-lib/aws-iam';

export class CdkStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: cdk.StackProps) {
    super(scope, id, props as Record<string, unknown>);

    const s3bucket = new Bucket(this, 'devopsdsm-bucket', {
      bucketName: 'devopsdsm-site',
      encryption: BucketEncryption.S3_MANAGED,
      websiteIndexDocument: 'index.html',
      objectOwnership: ObjectOwnership.OBJECT_WRITER,
	    blockPublicAccess: {
		    blockPublicPolicy: false,
		    blockPublicAcls: false,
		    ignorePublicAcls: false,
		    restrictPublicBuckets: false,
	    },
    });

    s3bucket.addToResourcePolicy(
      new PolicyStatement({
        resources: [
          s3bucket.arnForObjects("*"),
          s3bucket.bucketArn
        ],
        actions: ["s3:List*", "S3:Get*"],
        principals: [new AccountPrincipal(this.account)]
      })
    );

    new BucketDeployment(this, 'devopsdsm-bucket-deployment', {
      sources: [Source.asset('../app')],
      destinationBucket: s3bucket
    });

  }
}