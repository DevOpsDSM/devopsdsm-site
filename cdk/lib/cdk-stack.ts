import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { AppProps } from '../@types';
import * as S3 from 'aws-cdk-lib/aws-s3';

export class CdkStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: AppProps) {
    super(scope, id, props as Record<string, unknown>);

    const bucket = new S3.Bucket(this, 'devopsdsm-bucket', {
      versioned: true,
      websiteIndexDocument: 'index.html'
    });

  }
}
