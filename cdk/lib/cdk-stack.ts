import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Bucket, BucketEncryption, ObjectOwnership, RedirectProtocol } from 'aws-cdk-lib/aws-s3';
import { BucketDeployment, Source } from "aws-cdk-lib/aws-s3-deployment";
import { PolicyStatement, AnyPrincipal, AccountPrincipal } from 'aws-cdk-lib/aws-iam';
import { AllowedMethods, Distribution, OriginAccessIdentity, ViewerProtocolPolicy } from 'aws-cdk-lib/aws-cloudfront';
import { S3Origin } from 'aws-cdk-lib/aws-cloudfront-origins';
import { ARecord, HostedZone, RecordTarget } from 'aws-cdk-lib/aws-route53';
import { CloudFrontTarget } from 'aws-cdk-lib/aws-route53-targets';
import { Certificate, CertificateValidation } from 'aws-cdk-lib/aws-certificatemanager';

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

    const s3bucket = new Bucket(this, 'devopsdsm-bucket', {
      bucketName: 'devopsdsm-site',
      encryption: BucketEncryption.S3_MANAGED,
      objectOwnership: ObjectOwnership.OBJECT_WRITER,
      versioned: true,
	    blockPublicAccess: {
		    blockPublicPolicy: false,
		    blockPublicAcls: false,
		    ignorePublicAcls: false,
		    restrictPublicBuckets: false,
	    },
      serverAccessLogsBucket: s3ServerLogsBucket,
      websiteRedirect: {
        hostName: 'www.devopsdsm.com',
        protocol:RedirectProtocol.HTTPS
      }
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

    const cert = new Certificate(this, 'devops-dsm-cert', {
      domainName: "*.devopsdsm.com",
      validation: CertificateValidation.fromDns(hostedZone)
    });

    const cfnDistro = new Distribution(this, 'cfn-distro-for-devopsdsm', {
      defaultBehavior: {
        origin: new S3Origin(s3bucket, { 
          originAccessIdentity: originAccess
        }),
        viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        allowedMethods: AllowedMethods.ALLOW_ALL,
      },
      domainNames: ["devopsdsm.com", "www.devopsdsm.com"],
      certificate: cert
    });

    new ARecord(this, 'r53-record-to-cfn-distro', {
      target: RecordTarget.fromAlias(new CloudFrontTarget(cfnDistro)),
      zone: hostedZone,
      recordName: 'www'
    });

    new ARecord(this, 'r53-blank-record-to-cfn-distro', {
      target: RecordTarget.fromAlias(new CloudFrontTarget(cfnDistro)),
      zone: hostedZone,
      recordName: ''
    });


  }
}
