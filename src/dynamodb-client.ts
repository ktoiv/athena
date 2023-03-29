import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { ddbClient } from './client/DynamoClient';
import { randomUUID } from 'crypto'
import { HorsePerformance } from './model/types'
import { PutCommand, PutCommandInput } from "@aws-sdk/lib-dynamodb";

const client = DynamoDBDocumentClient.from(ddbClient)


const sendPerformancesToDynamoDb = async (performances: HorsePerformance[]) => {

    const putCommandInputs: PutCommandInput[] = performances.map(performance => {
        const params: PutCommandInput = {
            TableName: process.env.DYNAMODB_TABLE,
            Item: {
                id: randomUUID(),
                ...performance
            }
        }

        return params
    }) 

    const promises = putCommandInputs.map(async commandInput => {
        try {
            const data = await client.send(new PutCommand(commandInput))
        } catch (e) {
        }
    })

    await Promise.all(promises)
}

export const DynamoDBClient = {
    sendPerformancesToDynamoDb
}