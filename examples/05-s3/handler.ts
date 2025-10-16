/**
 * Example 5: S3 Events
 *
 * This example demonstrates:
 * - Handling S3 events (PUT, DELETE, etc.)
 * - Reading S3 objects (JSON, CSV, text)
 * - Processing multiple records
 * - Error handling
 * - Parsing different file formats
 */

import { Event, Logger } from 'acai-ts';
import { Record as S3Record } from 'acai-ts';
import { S3Event, S3EventRecord } from 'aws-lambda';

// Set up logger
const logger = new Logger({ minLevel: 'info' });
Logger.setUpGlobal();

/**
 * Process S3 events
 */
export const handler = async (event: S3Event): Promise<void> => {
  logger.info(`Processing ${event.Records.length} S3 event records`);

  // Wrap the event in acai-ts Event class
  const s3Event = new Event<S3EventRecord>(event);

  // Get all records
  const records = s3Event.records;

  // Process each record
  for (const awsRecord of records) {
    try {
      // Wrap in acai-ts S3Record for easier access
      const record = new S3Record(awsRecord);

      logger.info(`Processing S3 record: ${record.key}`);
      logger.debug({
        bucket: record.bucket,
        key: record.key,
        size: record.size,
        eventName: record.eventName
      });

      // Handle different event types
      if (record.eventName.startsWith('ObjectCreated')) {
        await handleObjectCreated(record);
      } else if (record.eventName.startsWith('ObjectRemoved')) {
        await handleObjectRemoved(record);
      }
    } catch (error) {
      logger.error({
        error: error instanceof Error ? error.message : error,
        recordId: awsRecord.responseElements?.['x-amz-request-id']
      });
      // Continue processing other records
    }
  }

  logger.info('Finished processing all S3 records');
};

/**
 * Handle object created events
 */
async function handleObjectCreated(record: S3Record): Promise<void> {
  logger.info(`Object created: s3://${record.bucket}/${record.key}`);

  // Determine file type by extension
  const extension = record.key.split('.').pop()?.toLowerCase();

  try {
    switch (extension) {
      case 'json':
        await processJsonFile(record);
        break;
      case 'csv':
        await processCsvFile(record);
        break;
      case 'txt':
      case 'log':
        await processTextFile(record);
        break;
      case 'xml':
        await processXmlFile(record);
        break;
      default:
        logger.warn(`Unsupported file type: ${extension}`);
    }
  } catch (error) {
    logger.error({
      error: error instanceof Error ? error.message : error,
      bucket: record.bucket,
      key: record.key
    });
  }
}

/**
 * Handle object removed events
 */
async function handleObjectRemoved(record: S3Record): Promise<void> {
  logger.info(`Object removed: s3://${record.bucket}/${record.key}`);

  // Example: Clean up related data, update indexes, etc.
  await cleanupRelatedData(record.bucket, record.key);
}

/**
 * Process JSON file
 */
async function processJsonFile(record: S3Record): Promise<void> {
  logger.info('Processing JSON file');

  // Read and parse JSON
  const data = await record.json();

  logger.info('JSON data:', data);

  // Example: Process the data
  if (Array.isArray(data)) {
    logger.info(`Processing ${data.length} items from JSON array`);
    for (const item of data) {
      await processItem(item);
    }
  } else {
    logger.info('Processing single JSON object');
    await processItem(data);
  }
}

/**
 * Process CSV file
 */
async function processCsvFile(record: S3Record): Promise<void> {
  logger.info('Processing CSV file');

  // Read and parse CSV
  const rows = await record.csv({
    columns: true, // Use first row as headers
    skip_empty_lines: true
  });

  logger.info(`Processing ${rows.length} rows from CSV`);

  // Process each row
  for (const row of rows) {
    logger.debug('CSV row:', row);
    await processItem(row);
  }
}

/**
 * Process text file
 */
async function processTextFile(record: S3Record): Promise<void> {
  logger.info('Processing text file');

  // Read as text
  const text = await record.text();

  logger.info(`File contains ${text.length} characters`);

  // Example: Process log lines
  const lines = text.split('\n').filter(line => line.trim());
  logger.info(`Processing ${lines.length} lines`);

  for (const line of lines) {
    await processLogLine(line);
  }
}

/**
 * Process XML file
 */
async function processXmlFile(record: S3Record): Promise<void> {
  logger.info('Processing XML file');

  // Read and parse XML
  const xmlData = await record.xml();

  logger.info('XML data:', xmlData);

  // Example: Process XML structure
  await processItem(xmlData);
}

/**
 * Process a single item (mock)
 */
async function processItem(item: any): Promise<void> {
  logger.debug('Processing item:', item);
  // In real app: validate, transform, store in database, etc.
}

/**
 * Process a log line (mock)
 */
async function processLogLine(line: string): Promise<void> {
  logger.debug('Processing log line:', line);
  // In real app: parse log format, extract metrics, detect errors, etc.
}

/**
 * Cleanup related data (mock)
 */
async function cleanupRelatedData(bucket: string, key: string): Promise<void> {
  logger.info(`Cleaning up data for s3://${bucket}/${key}`);
  // In real app: remove from database, invalidate cache, etc.
}

/**
 * Example: Batch processing multiple files
 */
export const batchHandler = async (event: S3Event): Promise<void> => {
  logger.info(`Batch processing ${event.Records.length} S3 records`);

  const s3Event = new Event<S3EventRecord>(event);
  const records = s3Event.records.map(r => new S3Record(r));

  // Group records by file type
  const recordsByType = records.reduce((acc, record) => {
    const extension = record.key.split('.').pop()?.toLowerCase() || 'unknown';
    if (!acc[extension]) {
      acc[extension] = [];
    }
    acc[extension].push(record);
    return acc;
  }, {} as Record<string, S3Record[]>);

  logger.info('Records by type:', Object.keys(recordsByType).map(type => ({
    type,
    count: recordsByType[type].length
  })));

  // Process each type in parallel
  await Promise.all(
    Object.entries(recordsByType).map(([type, typeRecords]) =>
      processByType(type, typeRecords)
    )
  );

  logger.info('Batch processing complete');
};

/**
 * Process records by type
 */
async function processByType(type: string, records: S3Record[]): Promise<void> {
  logger.info(`Processing ${records.length} ${type} files`);

  for (const record of records) {
    try {
      if (record.eventName.startsWith('ObjectCreated')) {
        await handleObjectCreated(record);
      }
    } catch (error) {
      logger.error({
        error: error instanceof Error ? error.message : error,
        key: record.key
      });
    }
  }
}

/**
 * Example S3 Event (for testing)
 */
const exampleEvent: S3Event = {
  Records: [
    {
      eventVersion: '2.1',
      eventSource: 'aws:s3',
      awsRegion: 'us-east-1',
      eventTime: new Date().toISOString(),
      eventName: 'ObjectCreated:Put',
      userIdentity: {
        principalId: 'AWS:AIDAI...'
      },
      requestParameters: {
        sourceIPAddress: '192.168.1.1'
      },
      responseElements: {
        'x-amz-request-id': 'REQUEST123',
        'x-amz-id-2': 'ID123'
      },
      s3: {
        s3SchemaVersion: '1.0',
        configurationId: 'config',
        bucket: {
          name: 'my-bucket',
          ownerIdentity: {
            principalId: 'OWNER123'
          },
          arn: 'arn:aws:s3:::my-bucket'
        },
        object: {
          key: 'uploads/data.json',
          size: 1024,
          eTag: 'etag123',
          sequencer: 'seq123'
        }
      }
    },
    {
      eventVersion: '2.1',
      eventSource: 'aws:s3',
      awsRegion: 'us-east-1',
      eventTime: new Date().toISOString(),
      eventName: 'ObjectCreated:Put',
      userIdentity: {
        principalId: 'AWS:AIDAI...'
      },
      requestParameters: {
        sourceIPAddress: '192.168.1.1'
      },
      responseElements: {
        'x-amz-request-id': 'REQUEST456',
        'x-amz-id-2': 'ID456'
      },
      s3: {
        s3SchemaVersion: '1.0',
        configurationId: 'config',
        bucket: {
          name: 'my-bucket',
          ownerIdentity: {
            principalId: 'OWNER123'
          },
          arn: 'arn:aws:s3:::my-bucket'
        },
        object: {
          key: 'logs/app.log',
          size: 2048,
          eTag: 'etag456',
          sequencer: 'seq456'
        }
      }
    }
  ]
};

/**
 * Example: Testing locally
 */
if (require.main === module) {
  handler(exampleEvent)
    .then(() => {
      console.log('Processing complete');
    })
    .catch(error => {
      console.error('Error:', error);
    });
}
