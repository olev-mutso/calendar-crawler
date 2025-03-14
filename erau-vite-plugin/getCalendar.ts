import fetch from 'node-fetch';


export async function getCalendar(): Promise<string> {
  const response = await fetch('https://www.erau.ee/et/kalender');
  if(!response.ok) {
    throw Error('Failed to fetch calendar!')
  }
  const content = await response.text()
  return content;
}