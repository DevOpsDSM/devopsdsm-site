#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { CdkStack } from '../lib/cdk-stack';
import { config } from '../config';

const app = new cdk.App();

const EnvConfig = {
    account: process.env.AWS_ACCOUNT,
    region: process.env.AWS_REGION
}


const appConfig = config as cdk.StackProps;

new CdkStack(app, 'CdkStack', {
  ...appConfig
});


function throwException(errorMessage: string): never {
    throw new Error(errorMessage);
}