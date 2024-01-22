#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { CdkStack } from '../lib/cdk-stack';
import { Secret } from 'aws-cdk-lib/aws-secretsmanager';

const app = new cdk.App();

new CdkStack(app, 'CdkStack', {
  env: {
    account: process.env.aws_account,
    region: process.env.aws_account
  }
}); 