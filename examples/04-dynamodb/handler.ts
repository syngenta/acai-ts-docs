/**
 * Example 4: DynamoDB Streams
 *
 * This example demonstrates:
 * - Processing DynamoDB Stream events
 * - Parsing DynamoDB Stream records
 * - Type conversion from DynamoDB format
 * - Batch processing
 * - Error handling
 */

import { Event, Logger } from 'acai-ts';
import { Record as DynamoDBRecord } from 'acai-ts';
import { DynamoDBStreamEvent, DynamoDBRecord as AWSDynamoDBRecord } from 'aws-lambda';

// Set up logger
const logger = new Logger({ minLevel: 'info' });
Logger.setUpGlobal();

/**
 * Process DynamoDB Stream events
 */
export const handler = async (event: DynamoDBStreamEvent): Promise<void> => {
  logger.info(`Processing ${event.Records.length} DynamoDB stream records`);

  // Wrap the event in acai-ts Event class
  const streamEvent = new Event<AWSDynamoDBRecord>(event);

  // Get all records
  const records = streamEvent.records;

  // Process each record
  for (const awsRecord of records) {
    try {
      // Wrap in acai-ts DynamoDBRecord for easier access
      const record = new DynamoDBRecord(awsRecord);

      logger.info(`Processing record: ${record.id}`);
      logger.debug({
        eventName: record.eventName,
        tableName: record.tableName,
        eventId: record.id
      });

      // Check event type
      if (record.eventName === 'INSERT') {
        await handleInsert(record);
      } else if (record.eventName === 'MODIFY') {
        await handleModify(record);
      } else if (record.eventName === 'REMOVE') {
        await handleRemove(record);
      }
    } catch (error) {
      logger.error({
        error: error instanceof Error ? error.message : error,
        recordId: awsRecord.eventID
      });
      // Continue processing other records
    }
  }

  logger.info('Finished processing all records');
};

/**
 * Handle INSERT events
 */
async function handleInsert(record: DynamoDBRecord): Promise<void> {
  logger.info('Handling INSERT event');

  // Get the new item (automatically converted from DynamoDB format)
  const newItem = record.newImage;

  logger.info('New item:', newItem);

  // Example: Send notification, update search index, etc.
  if (newItem) {
    await sendNotification({
      type: 'user_created',
      userId: newItem.id,
      email: newItem.email,
      name: newItem.name
    });
  }
}

/**
 * Handle MODIFY events
 */
async function handleModify(record: DynamoDBRecord): Promise<void> {
  logger.info('Handling MODIFY event');

  // Get old and new values
  const oldItem = record.oldImage;
  const newItem = record.newImage;

  logger.info('Old item:', oldItem);
  logger.info('New item:', newItem);

  // Example: Track changes, update materialized views, etc.
  if (oldItem && newItem) {
    const changes = getChangedFields(oldItem, newItem);
    logger.info('Changed fields:', changes);

    await trackChanges({
      userId: newItem.id,
      changes,
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * Handle REMOVE events
 */
async function handleRemove(record: DynamoDBRecord): Promise<void> => {
  logger.info('Handling REMOVE event');

  // Get the deleted item
  const oldItem = record.oldImage;

  logger.info('Deleted item:', oldItem);

  // Example: Clean up related data, send notifications, etc.
  if (oldItem) {
    await cleanupRelatedData(oldItem.id);
    await sendNotification({
      type: 'user_deleted',
      userId: oldItem.id,
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * Helper: Get changed fields between old and new items
 */
function getChangedFields(oldItem: any, newItem: any): Record<string, any> {
  const changes: Record<string, any> = {};

  for (const key in newItem) {
    if (JSON.stringify(oldItem[key]) !== JSON.stringify(newItem[key])) {
      changes[key] = {
        old: oldItem[key],
        new: newItem[key]
      };
    }
  }

  return changes;
}

/**
 * Example: Send notification (mock)
 */
async function sendNotification(data: any): Promise<void> {
  logger.info('Sending notification:', data);
  // In real app: send to SNS, SQS, email service, etc.
}

/**
 * Example: Track changes (mock)
 */
async function trackChanges(data: any): Promise<void> {
  logger.info('Tracking changes:', data);
  // In real app: write to audit log table, analytics, etc.
}

/**
 * Example: Cleanup related data (mock)
 */
async function cleanupRelatedData(userId: string): Promise<void> {
  logger.info(`Cleaning up data for user: ${userId}`);
  // In real app: delete related records, files, etc.
}

/**
 * Example: Advanced processing with batch operations
 */
export const batchHandler = async (event: DynamoDBStreamEvent): Promise<void> => {
  logger.info(`Processing batch of ${event.Records.length} records`);

  const streamEvent = new Event<AWSDynamoDBRecord>(event);
  const records = streamEvent.records;

  // Group records by event type
  const inserts = records.filter(r => r.eventName === 'INSERT');
  const modifies = records.filter(r => r.eventName === 'MODIFY');
  const removes = records.filter(r => r.eventName === 'REMOVE');

  logger.info(`Inserts: ${inserts.length}, Modifies: ${modifies.length}, Removes: ${removes.length}`);

  // Process in batches
  await Promise.all([
    processBatch(inserts, 'INSERT'),
    processBatch(modifies, 'MODIFY'),
    processBatch(removes, 'REMOVE')
  ]);

  logger.info('Batch processing complete');
};

/**
 * Process a batch of records
 */
async function processBatch(
  records: AWSDynamoDBRecord[],
  eventType: string
): Promise<void> {
  if (records.length === 0) return;

  logger.info(`Processing ${records.length} ${eventType} records`);

  // Convert to acai-ts Records
  const acaiRecords = records.map(r => new DynamoDBRecord(r));

  // Extract data
  const items = acaiRecords
    .map(r => (eventType === 'REMOVE' ? r.oldImage : r.newImage))
    .filter(item => item !== null);

  // Batch operation (example: bulk index update)
  logger.info(`Performing batch operation on ${items.length} items`);
  // In real app: batch write to search index, cache, etc.
}

/**
 * Example DynamoDB Stream Event (for testing)
 */
const exampleEvent: DynamoDBStreamEvent = {
  Records: [
    {
      eventID: '1',
      eventName: 'INSERT',
      eventVersion: '1.1',
      eventSource: 'aws:dynamodb',
      awsRegion: 'us-east-1',
      dynamodb: {
        ApproximateCreationDateTime: Date.now() / 1000,
        Keys: {
          id: { S: 'user-123' }
        },
        NewImage: {
          id: { S: 'user-123' },
          name: { S: 'Alice' },
          email: { S: 'alice@example.com' },
          age: { N: '30' },
          active: { BOOL: true },
          tags: { L: [{ S: 'premium' }, { S: 'verified' }] }
        },
        SequenceNumber: '111',
        SizeBytes: 100,
        StreamViewType: 'NEW_AND_OLD_IMAGES'
      },
      eventSourceARN: 'arn:aws:dynamodb:us-east-1:123456789:table/Users/stream/2025-01-01T00:00:00.000'
    },
    {
      eventID: '2',
      eventName: 'MODIFY',
      eventVersion: '1.1',
      eventSource: 'aws:dynamodb',
      awsRegion: 'us-east-1',
      dynamodb: {
        ApproximateCreationDateTime: Date.now() / 1000,
        Keys: {
          id: { S: 'user-456' }
        },
        OldImage: {
          id: { S: 'user-456' },
          name: { S: 'Bob' },
          email: { S: 'bob@example.com' },
          active: { BOOL: true }
        },
        NewImage: {
          id: { S: 'user-456' },
          name: { S: 'Bob Smith' },
          email: { S: 'bob.smith@example.com' },
          active: { BOOL: false }
        },
        SequenceNumber: '222',
        SizeBytes: 150,
        StreamViewType: 'NEW_AND_OLD_IMAGES'
      },
      eventSourceARN: 'arn:aws:dynamodb:us-east-1:123456789:table/Users/stream/2025-01-01T00:00:00.000'
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
