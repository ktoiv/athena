import axios, { AxiosResponse } from "axios"
import { HorsePerformance } from "./model/types"

const VEIKKAUS_BASE_URL = process.env.VEIKKAUS_URL || ''
const CARD_PATH = "cards"
const SWEDEN_COUNTRY_CODE = "SE"

export type Card = {
    cardId: number;
    country: string;
    trackName: string;
    trackAbbreviation: string;
}

export type Race = {
    raceId: number;
    cardId: number;
    number: number;
    distance: number;
    toteResultString: string;
}

export type Runner = {
    runnerId: number;
    horseName: string;
    startNumber: number;
    startTrack: number;
    distance: number;
    frontShoes: 'HAS_SHOES' | 'NO_SHOES'
    rearShoes: 'HAS_SHOES' | 'NO_SHOES'
    stats: object;
    coachName: string;
    driverName: string;
    scratched: boolean;
}


const buildResultsForDate = async (date :Date): Promise<HorsePerformance[]> => {

    const timestamp = date.getTime()
    console.log('Timestamp for date is', timestamp)
    const cards: Card[] = await fetchCardsForDate(date)
    
    const racePromises: Promise<Race[]>[] = cards.map(async card => {
        const races: Race[] = await fetchRacesForCard(card)
        return races
    })

    const races: Race[][] = await Promise.all(racePromises)
    const flatRaces: Race[] = races.flatMap(race => race) 

    const performancePromises: Promise<HorsePerformance[]>[] =  flatRaces.map(async race => {
        const winner = getWinningNumber(race.toteResultString)

        if (winner === -1) {
            return []
        }
        
        const runners: Runner[] = await fetchRunnersForRace(race)

        const performances: HorsePerformance[] = runners.map(runner => {
            return {
                name: cleanRunnerName(runner.horseName),
                winner: runner.startNumber === winner,
                coach: runner.coachName,
                driver: runner.driverName,
                date: timestamp,
            }
        })

        return performances
    })

    const performances: HorsePerformance[][] = await Promise.all(performancePromises)
    const flatPerformances: HorsePerformance[] = performances.flatMap(performance => performance) 
    
    return flatPerformances
}


const fetchCardsForDate = async (date: Date): Promise<Card[]> => {
    try {
        const response: AxiosResponse = await axios.get(`${VEIKKAUS_BASE_URL}/${CARD_PATH}/date/${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`)
        const cards: Card[] = response.data.collection
        const swedishCards: Card[] =  cards.filter(card => card.country === SWEDEN_COUNTRY_CODE)
    
        return swedishCards

    } catch (error) {
        console.log("Could not find cards for today, returning empty list", 'REASON:', error)
        return []
    }
}

const RACE_PATH_PREFIX = "card"
const RACE_PATH_SUFFIX = "races"

const fetchRacesForCard = async (card: Card): Promise<Race[]> => {
    try {
        const response = await axios.get(`${VEIKKAUS_BASE_URL}/${RACE_PATH_PREFIX}/${card.cardId}/${RACE_PATH_SUFFIX}`)
        const races: Race[] = response.data.collection

        return races

    } catch (error) {
        console.log("Coul not find races for", card.trackName, ", returning empty list")
        return []
    }
}


const RUNNERS_PATH_PREFIX = "race"
const RUNNERS_PATH_SUFFIX = "runners"

const fetchRunnersForRace = async (race: Race): Promise<Runner[]> => {
    try {
        const response = await axios.get(`${VEIKKAUS_BASE_URL}/${RUNNERS_PATH_PREFIX}/${race.raceId}/${RUNNERS_PATH_SUFFIX}`)
        const runners: Runner[] = response.data.collection

        return runners.filter(runner => runner.scratched === false)

    } catch (error) {
        console.log("Coul not find runners for race number", race.number, ", returning empty list")
        return []
    }
}

const getWinningNumber = (resultString: string): number => {
    try {
        const parts = resultString.split('-')
        return parseInt(parts[0])
    } catch (e) {
        return -1
    }
}

const cleanRunnerName = (name: string): string => {
    const parts = name.split('*')
    return parts[0]

}


export const DataBuilder = {
    buildResultsForDate
}