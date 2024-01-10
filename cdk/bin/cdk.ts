#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { CdkStack } from '../lib/cdk-stack';
import { config } from '../config';
import merge from 'lodash.merge';
import { AppProps } from '../@types'

const app = new cdk.App();

const EnvConfig = {
    account: process.env.AWS_ACCOUNT,
    region: process.env.AWS_REGION
}

const envConfig = 
    config[app.node.tryGetContext('environment')] ??
    throwException('Error: --context environment must be Development set on command');

const appConfig = merge({ env: EnvConfig }, config.app, envConfig) as AppProps;





new CdkStack(app, 'CdkStack', {
  ...appConfig
});


function throwException(errorMessage: string): never {
    throw new Error(errorMessage);
}