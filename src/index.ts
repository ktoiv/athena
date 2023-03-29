import { Handler } from "aws-lambda";
import { DataBuilder } from "./data-builder";
import { DynamoDBClient } from "./dynamodb-client";
import { HorsePerformance } from "./model/types";

const dayInMillis = 60 * 60 * 24 * 1000

export const handler: Handler = async (event) => {
    const date = new Date()
    const yesterdayTime = date.getTime() - dayInMillis
    const yesterday = new Date(yesterdayTime)

    console.log('Updating database with date', yesterday.getDate(), yesterday.getMonth() + 1, yesterday.getFullYear())
    const performances: HorsePerformance[] = await DataBuilder.buildResultsForDate(yesterday)
    console.log(`Found ${performances.length} performances for date`, yesterday)
    await DynamoDBClient.sendPerformancesToDynamoDb(performances)
    console.log('Database updated')
}