export type Talk = {
  event: string;
  year: number;
  title: string;
  url: string;
  youtubeId?: string;
  youtubeStart?: number;
  slides?: string;
  keynote?: boolean;
};

export const talks: Talk[] = [
  {
    event: "PyCon DE & PyData",
    year: 2025,
    title: "Generative AI Monitoring with PydanticAI and Logfire",
    url: "https://2025.pycon.de/talks/GS9QWQ/",
  },
  {
    event: "PyCon Italy",
    year: 2025,
    title: "Generative AI Monitoring with PydanticAI and Logfire",
    url: "https://2025.pycon.it/en/event/fastapi-benchmarks",
    youtubeId: "agSsmylyHpI",
  },
  {
    event: "PyCon Portugal",
    year: 2024,
    title: "Unlocking ASGI Innovations: How FastAPI Reaps the Benefits",
    url: "https://pretalx.evolutio.pt/pycon-portugal-2024/speaker/RRPZWA/",
    youtubeId: "kcZ8TBTg-Uk",
    slides: "/slides/asgi_innovations.html",
  },
  {
    event: "EuroPython",
    year: 2024,
    title: "FastAPI Internals",
    url: "https://ep2024.europython.eu/session/fastapi-internals",
    youtubeId: "QcRq3F8FpSg",
  },
  {
    event: "PyCon Italy",
    year: 2024,
    title: "FastAPI Internals: How does it work?",
    url: "https://2024.pycon.it/en/event/fastapi-internals-how-does-it-work",
    youtubeId: "nYAMtzAbNN8",
  },
  {
    event: "PyCon Spain",
    year: 2023,
    title: "The validation evolution: Pydantic V2tronger",
    url: "https://charlas.2023.es.pycon.org/pycones-2023/talk/SVLHVA/",
    youtubeId: "Z_G1h6YxiT8",
    slides: "/slides/pydantic_v2tronger.html",
  },
  {
    event: "PyCon India",
    year: 2023,
    title: "How the duck those packages work?",
    url: "https://in.pycon.org/2023/speakers/",
    slides: "/slides/how_the_duck_those_web_packages_work.html",
    keynote: true,
  },
  {
    event: "Sentry + FastAPI Berlin Meetup",
    year: 2023,
    title: "The History of FastAPI",
    url: "https://sentry.io/resources/fastapi-event/",
    youtubeId: "Rms75K0AM4s",
    youtubeStart: 1999,
    slides: "/slides/fastapi_history.html",
  },
  {
    event: "EuroPython",
    year: 2023,
    title: "Performance tips by the FastAPI Expert",
    url: "https://ep2023.europython.eu/speaker/marcelo-trylesinski",
    youtubeId: "7jtzjovKQ8A",
  },
  {
    event: "PyCon Poland",
    year: 2023,
    title: "Chronicles of an Open Source Developer",
    url: "https://pl.pycon.org/2023/en/prelegenci/",
    youtubeId: "P86TcI0bRQI",
    keynote: true,
  },
  {
    event: "PyCon Italy",
    year: 2023,
    title: "What does Starlette really do for FastAPI?",
    url: "https://2023.pycon.it/en/event/what-does-starlette-really-do-for-fastapi",
    youtubeId: "SvQiSa7ua-Y",
  },
  {
    event: "PyGeekle",
    year: 2022,
    title: "What does Starlette really do for FastAPI?",
    url: "https://www.youtube.com/live/2fgBKDT1j8k?feature=share&t=22986",
    youtubeId: "2fgBKDT1j8k",
    youtubeStart: 22987,
  },
  {
    event: "Pyjamas",
    year: 2022,
    title: "Performance tips by the FastAPI Expert",
    url: "https://www.youtube.com/embed/-CjKMfva398",
    youtubeId: "-CjKMfva398",
  },
  {
    event: "PyCon Portugal",
    year: 2022,
    title: "How to become a FastAPI Expert",
    url: "https://pretalx.evolutio.pt/pyconpt2022/talk/ETRAXR/",
    youtubeId: "ULhX7761GAY",
  },
];
