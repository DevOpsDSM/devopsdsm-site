#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { CdkStack } from '../lib/cdk-stack';

const app = new cdk.App();

let appConfig = app.node.tryGetContext('env');

new CdkStack(app, 'CdkStack', {
  ...appConfig
});