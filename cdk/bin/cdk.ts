#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { CdkStack } from '../lib/cdk-stack';

const app = new cdk.App();

let env = app.node.tryGetContext('config');

new CdkStack(app, 'CdkStack', {
  env: {
    account: env.props.aws_account,
    region: env.props.aws_region
  }
});