import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Bucket, BucketEncryption, ObjectOwnership, RedirectProtocol } from 'aws-cdk-lib/aws-s3';
import { BucketDeployment, Source } from "aws-cdk-lib/aws-s3-deployment";
import { PolicyStatement, AnyPrincipal, AccountPrincipal } from 'aws-cdk-lib/aws-iam';
import { AllowedMethods, CachePolicy, Distribution, OriginAccessIdentity, ViewerProtocolPolicy } from 'aws-cdk-lib/aws-cloudfront';
import { S3Origin } from 'aws-cdk-lib/aws-cloudfront-origins';
import { ARecord, HostedZone, RecordTarget } from 'aws-cdk-lib/aws-route53';
import { CloudFrontTarget } from 'aws-cdk-lib/aws-route53-targets';
import { Certificate } from 'aws-cdk-lib/aws-certificatemanager';
import { Secret } from 'aws-cdk-lib/aws-secretsmanager';
import { CfnBudget } from 'aws-cdk-lib/aws-budgets';

export class CdkStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: cdk.StackProps) {
    super(scope, id, props as Record<string, unknown>);

    const s3ServerLogsBucket = new Bucket(this, 'devopsdsm-server-logs-bucket', {
      bucketName: 'devopsdsm-site-server-logs',
      encryption: BucketEncryption.S3_MANAGED,
      objectOwnership: ObjectOwnership.OBJECT_WRITER
    });

    s3ServerLogsBucket.addToResourcePolicy(
      new PolicyStatement({
        resources: [
          s3ServerLogsBucket.arnForObjects("*"),
          s3ServerLogsBucket.bucketArn
        ],
        actions: ["s3:List*", "S3:Get*"],
        principals: [new AccountPrincipal(this.account)],
      })
    );

    const s3redirectBucket = new Bucket(this, 'devopsdsm-redirect-bucket', {
      bucketName: 'devopsdsm.com',
      encryption: BucketEncryption.S3_MANAGED,
      objectOwnership: ObjectOwnership.OBJECT_WRITER,
      websiteRedirect: {
        hostName: 'www.devopsdsm.com',
        protocol: RedirectProtocol.HTTPS
      },
      blockPublicAccess: {
		    blockPublicPolicy: false,
		    blockPublicAcls: false,
		    ignorePublicAcls: false,
		    restrictPublicBuckets: false,
	    }
    });

    s3redirectBucket.addToResourcePolicy(
      new PolicyStatement({
        resources: [
          s3redirectBucket.arnForObjects("*"),
          s3redirectBucket.bucketArn
        ],
        actions: ["s3:List*", "S3:Get*"],
        principals: [new AnyPrincipal()],
      })
    );

    const s3bucket = new Bucket(this, 'devopsdsm-bucket', {
      bucketName: 'www.devopsdsm.com',
      encryption: BucketEncryption.S3_MANAGED,
      websiteIndexDocument: 'index.html',
      objectOwnership: ObjectOwnership.OBJECT_WRITER,
      versioned: true,
	    blockPublicAccess: {
		    blockPublicPolicy: false,
		    blockPublicAcls: false,
		    ignorePublicAcls: false,
		    restrictPublicBuckets: false,
	    },
      serverAccessLogsBucket: s3ServerLogsBucket
    });

    s3bucket.addToResourcePolicy(
      new PolicyStatement({
        resources: [
          s3bucket.arnForObjects("*"),
          s3bucket.bucketArn
        ],
        actions: ["s3:List*", "S3:Get*"],
        principals: [new AnyPrincipal()]
      })
    );

    new BucketDeployment(this, 'devopsdsm-bucket-deployment', {
      sources: [Source.asset('../app')],
      destinationBucket: s3bucket
    });

    const originAccess = new OriginAccessIdentity(this, 'devopsdsm-oai-policy', {
      comment: 'OAI for the CloudFront distribution of s3 static bucket devopsdsm-site'
    });

    const hostedZone = HostedZone.fromLookup(this, 'hosted-zone', {
      domainName: "devopsdsm.com"
    });

    const secret = Secret.fromSecretNameV2(this, 'cdk-stack-secrets', 'cdk-stack');
    const certArn = secret.secretValueFromJson('certificate_arn').unsafeUnwrap();

    const cert = Certificate.fromCertificateArn(this, 'www.devopsdsm.com', certArn);

    const cfnDistro = new Distribution(this, 'cfn-distro-for-devopsdsm', {
      defaultBehavior: {
        origin: new S3Origin(s3bucket, { 
          originAccessIdentity: originAccess
        }),
        viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        allowedMethods: AllowedMethods.ALLOW_ALL,
      },
      domainNames: ["www.devopsdsm.com"],
      defaultRootObject: "index.html",
      certificate: cert
    });

    const originAccessRoot = new OriginAccessIdentity(this, 'devopsdsm-oai-policy-root', {
      comment: 'OAI for the CloudFront distribution of s3 static bucket devopsdsm.com'
    });

    const cfnDistroRoot = new Distribution(this, 'cfn-distro-for-devopsdsm-root-domain', {
      defaultBehavior: {
        origin: new S3Origin(s3redirectBucket, { 
          originAccessIdentity: originAccessRoot
        }),
        viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        allowedMethods: AllowedMethods.ALLOW_ALL,
        cachePolicy: CachePolicy.CACHING_DISABLED
      },
      domainNames: ["devopsdsm.com"],
      certificate: cert
    });

    new ARecord(this, 'r53-record-to-cfn-distro', {
      target: RecordTarget.fromAlias(new CloudFrontTarget(cfnDistro)),
      zone: hostedZone,
      recordName: 'www'
    });

    new ARecord(this, 'r53-blank-record-to-cfn-distro', {
      target: RecordTarget.fromAlias(new CloudFrontTarget(cfnDistroRoot)),
      zone: hostedZone,
      recordName: ''
    });

    const slackNotificationEmail = secret.secretValueFromJson('slack_notification_email').unsafeUnwrap();

    const budget = new CfnBudget(this, 'devopsdsm-budget', {
      budget: {
        budgetName: "devopsdsm-budget",
        budgetType: "COST",
        timeUnit: "MONTHLY",
        budgetLimit: {
          amount: 25,
          unit: "USD"
        }
      },
      notificationsWithSubscribers: [{
        notification: {
          notificationType: "ACTUAL",
          comparisonOperator: "GREATER_THAN",
          threshold: 90
        },
        subscribers: [{
          subscriptionType: "EMAIL",
          address: slackNotificationEmail
        }]
      }]
    });


  }
}
