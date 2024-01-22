#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { CdkStack } from '../lib/cdk-stack';
import { Secret } from 'aws-cdk-lib/aws-secretsmanager';

const app = new cdk.App();

const appConfig = app.node.tryGetContext('config');

const secret = Secret.fromSecretNameV2(app, 'cdk-stack-secrets', 'cdk-stack');
const account = secret.secretValueFromJson('aws_account').toString();

new CdkStack(app, 'CdkStack', {
  env: {
    account,
    region: appConfig.region
  }
}); 