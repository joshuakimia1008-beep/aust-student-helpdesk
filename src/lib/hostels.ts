import juliusRoom from '@/assets/hostels/hostel-julius-room.jpg'
import juliusRoom2 from '@/assets/hostels/hostel-julius-room2.jpg'
import juliusKitchen from '@/assets/hostels/hostel-julius-kitchenette.jpg'
import kwameRoom from '@/assets/hostels/hostel-kwame-room2.jpg'
import kwameStudy from '@/assets/hostels/hostel-kwame-study.jpg'
import kwameStudy2 from '@/assets/hostels/hostel-kwame-study2.jpg'
import kwameImg from '@/assets/hostels/hostel-kwame-img8005.jpg'
import nnamdiRoom from '@/assets/hostels/hostel-nnamdi-room.jpg'
import nnamdiStudy from '@/assets/hostels/hostel-nnamdi-study.jpg'
import hero from '@/assets/hostels/hero.jpg'
import campus from '@/assets/hostels/campus.jpg'

export type RoomOption = { type: string; perSemester: string; perYear: string; description: string }
export type Hostel = {
  name: string
  tagline: string
  images: string[]
  rooms: RoomOption[]
  features: string[]
}

// Source: https://admissions.aust.edu.ng/hostels (1 year lease)
export const HOSTELS: Hostel[] = [
  {
    name: 'Nnamdi Azikiwe Hall',
    tagline: 'A vibrant community of shared rooms at the heart of campus.',
    images: [nnamdiRoom, nnamdiStudy],
    rooms: [
      { type: 'Shared Room · 2 persons', perSemester: '₦520,000', perYear: '₦1,040,000', description: 'Comfortable shared accommodation for 2 persons in a vibrant community setting.' },
      { type: 'Shared Room · 3 persons', perSemester: '₦455,000', perYear: '₦910,000', description: 'Shared accommodation for 3 persons with modern amenities.' },
    ],
    features: ['Shared bathroom facilities', 'Study desk and chair', 'Wardrobe', 'Internet access', '24/7 security'],
  },
  {
    name: 'Kwame Nkrumah Hall',
    tagline: 'Modern shared and postgraduate single rooms with dedicated study space.',
    images: [kwameRoom, kwameStudy2, kwameStudy, kwameImg],
    rooms: [
      { type: 'Shared Room · 2 persons', perSemester: '₦520,000', perYear: '₦1,040,000', description: 'Shared accommodation for 2 persons with modern amenities.' },
      { type: 'Shared Room · 4 persons', perSemester: '₦442,000', perYear: '₦884,000', description: 'Shared accommodation for 4 persons with modern amenities.' },
      { type: 'Single Room (Postgraduate)', perSemester: '₦525,000', perYear: '₦1,050,000', description: 'Single occupancy room reserved for postgraduate students.' },
    ],
    features: ['Private study space', 'Study desk and chair', 'Wardrobe', 'Internet access', '24/7 security'],
  },
  {
    name: 'Julius Nyerere Hall',
    tagline: 'High-end rooms offering privacy, comfort and a kitchenette.',
    images: [juliusRoom, juliusRoom2, juliusKitchen],
    rooms: [
      { type: 'Single Room (Postgraduate)', perSemester: '₦780,000', perYear: '₦1,560,000', description: 'High-end single occupancy room offering maximum privacy, comfort, and premium study spaces.' },
      { type: 'Shared Room · 2 persons', perSemester: '₦575,000', perYear: '₦1,150,000', description: 'Shared accommodation for 2 persons in a comfortable hall setting.' },
    ],
    features: ['Private study space', 'Study desk and chair', 'Wardrobe', 'Internet access', '24/7 security'],
  },
  {
    name: 'Knowledge Court',
    tagline: 'Premium postgraduate singles and shared rooms for 3 or 4.',
    images: [juliusRoom2, juliusRoom, juliusKitchen],
    rooms: [
      { type: 'Single Room (Postgraduate)', perSemester: '₦825,000', perYear: '₦1,650,000', description: 'Premium single room accommodation for postgraduate students.' },
      { type: 'Shared Room · 3 persons', perSemester: '₦675,000', perYear: '₦1,350,000', description: 'Shared room accommodation for 3 persons in Knowledge Court.' },
      { type: 'Shared Room · 4 persons', perSemester: '₦575,000', perYear: '₦1,150,000', description: 'Shared room accommodation for 4 persons in Knowledge Court.' },
    ],
    features: ['Shared bathroom facilities', 'Study desk and chair', 'Wardrobe', 'Internet access', '24/7 security'],
  },
]

export const SLIDES = [
  { image: hero, title: 'AUST Student Housing', caption: 'Secure, comfortable living on the Abuja campus.' },
  { image: campus, title: 'The AUST Campus', caption: 'Halls, lecture theatres and open spaces — all in one place.' },
  { image: nnamdiRoom, title: 'Nnamdi Azikiwe Hall', caption: 'Shared rooms in a vibrant community setting.' },
  { image: kwameStudy2, title: 'Kwame Nkrumah Hall', caption: 'Dedicated study spaces for focused work.' },
  { image: juliusRoom, title: 'Julius Nyerere Hall', caption: 'Premium singles with privacy and comfort.' },
  { image: juliusKitchen, title: 'Knowledge Court', caption: 'Postgraduate living with modern amenities.' },
]

export const VENUES = [
  'Main Auditorium',
  'Nnamdi Azikiwe Hall Common Room',
  'Kwame Nkrumah Hall Common Room',
  'Julius Nyerere Hall Common Room',
  'Knowledge Court Lounge',
  'Sports Field',
  'Lecture Theatre',
  'Open Space / Quad',
]
