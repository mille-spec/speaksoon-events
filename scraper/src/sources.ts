import { Source } from './types.js';

export const TIER_1_SOURCES: Source[] = [
  // Eventbrite
  { name: 'Eventbrite BE Business', platform: 'eventbrite', tier: 1,
    url: 'https://www.eventbrite.com/b/belgium/business/' },
  { name: 'Eventbrite BE Networking', platform: 'eventbrite', tier: 1,
    url: 'https://www.eventbrite.com/d/belgium/networking/' },
  { name: 'Eventbrite NL Business', platform: 'eventbrite', tier: 1,
    url: 'https://www.eventbrite.com/b/netherlands/business/' },

  // Luma
  { name: 'Luma Discover', platform: 'luma', tier: 1,
    url: 'https://lu.ma/discover' },
  { name: 'Luma Tech', platform: 'luma', tier: 1,
    url: 'https://lu.ma/tech' },
  { name: 'Luma AI', platform: 'luma', tier: 1,
    url: 'https://lu.ma/ai' },
  { name: 'Luma Brussels', platform: 'luma', tier: 1,
    url: 'https://lu.ma/brussels' },

  // Meetup
  { name: 'Meetup Brussels Networking', platform: 'meetup', tier: 1,
    url: 'https://www.meetup.com/find/be--brussels/networking/' },
  { name: 'Meetup Antwerp Networking', platform: 'meetup', tier: 1,
    url: 'https://www.meetup.com/find/be--antwerpen/networking/' },
  { name: 'Meetup Brussels Business', platform: 'meetup', tier: 1,
    url: 'https://www.meetup.com/find/be--brussels/career-business/' },

  // Aggregators
  { name: '10times Belgium', platform: '10times', tier: 1,
    url: 'https://10times.com/belgium' },
  { name: '10times Netherlands', platform: '10times', tier: 1,
    url: 'https://10times.com/netherlands' },
  { name: 'AllEvents Brussels Business', platform: 'allevents', tier: 1,
    url: 'https://allevents.in/brussels/business' },
  { name: 'TradefairDates Belgium', platform: 'tradefairdates', tier: 1,
    url: 'https://www.tradefairdates.com/Fairs-Belgium-Z21-S1.html' },
  { name: 'TradefairDates Netherlands', platform: 'tradefairdates', tier: 1,
    url: 'https://www.tradefairdates.com/Fairs-Netherlands-Z163-S1.html' },
  { name: 'Belgium Tech Events', platform: 'belgiumtech', tier: 1,
    url: 'https://www.belgiumtech.events/' },
  { name: 'b2match Belgium', platform: 'b2match', tier: 1,
    url: 'https://www.b2match.com/b/belgium' },
];

export const TIER_2_SOURCES: Source[] = [
  // VOKA
  { name: 'VOKA Network Events', platform: 'voka', tier: 2,
    url: 'https://www.voka.be/netwerkevents' },
  { name: 'VOKA Network Events p2', platform: 'voka', tier: 2,
    url: 'https://www.voka.be/netwerkevents?page=1' },
  { name: 'VOKA Network Events p3', platform: 'voka', tier: 2,
    url: 'https://www.voka.be/netwerkevents?page=2' },
  { name: 'VOKA Network Events p4', platform: 'voka', tier: 2,
    url: 'https://www.voka.be/netwerkevents?page=3' },
  { name: 'VOKA Network Events p5', platform: 'voka', tier: 2,
    url: 'https://www.voka.be/netwerkevents?page=4' },
  { name: 'VOKA Network Events p6', platform: 'voka', tier: 2,
    url: 'https://www.voka.be/netwerkevents?page=5' },
  { name: 'VOKA Jong Voka', platform: 'voka', tier: 2,
    url: 'https://www.voka.be/jongvoka/activiteiten' },
  { name: 'VOKA Mechelen-Kempen', platform: 'voka', tier: 2,
    url: 'https://www.voka.be/mk/netwerkevents' },
  { name: 'VOKA Limburg', platform: 'voka', tier: 2,
    url: 'https://www.voka.be/limburg/events' },
  { name: 'Jong Voka Limburg Connect', platform: 'voka', tier: 2,
    url: 'https://www.jongvokalimburgconnect.be/evenementen/' },

  // Chambers + Federations
  { name: 'BECI Brussels', platform: 'beci', tier: 2,
    url: 'https://www.beci.be/en/event' },
  { name: 'BECI Brussels p2', platform: 'beci', tier: 2,
    url: 'https://www.beci.be/en/event/page/2?search=&date=upcoming&tags=&type=all&country=all' },
  { name: 'BECI Brussels p3', platform: 'beci', tier: 2,
    url: 'https://www.beci.be/en/event/page/3?search=&date=upcoming&tags=&type=all&country=all' },
  { name: 'UNIZO National', platform: 'unizo', tier: 2,
    url: 'https://www.unizo.be/nl/events' },
  { name: 'UNIZO West-Vlaanderen', platform: 'unizo', tier: 2,
    url: 'https://unizowvl.be/kalender-provinciale-events/' },
  { name: 'Agoria Tech', platform: 'agoria', tier: 2,
    url: 'https://www.agoria.be/en/agenda' },
  { name: 'VBO/FEB', platform: 'vbo', tier: 2,
    url: 'https://www.vbo-feb.be/nl/evenementen/' },
];

export const ALL_SOURCES = [...TIER_1_SOURCES, ...TIER_2_SOURCES];
