export const ROOM_STEP = {
  CHOOSE_OPTION: 0,
  SEND_KEY: 1,
  END: 2,
};

export const ROOM_RESULT = {
  UNDECIDED: 0,
  WINNER_1: 1,
  DRAW: 2,
  WINNER_2: 3,
};

export const ROOM_STATUS = {
  EMPTY: 0,
  ONE_PLAYER: 1,
  TWO_PLAYERS: 2,
  CLOSED: 3,
};

export const PLAYER_OPTIONS = [
  {
    id: 1,
    imageSrc: "/img/keo.webp",
  },
  {
    id: 2,
    imageSrc: "/img/bua.png",
  },
  {
    id: 3,
    imageSrc: "/img/bao.webp",
  },
];

export const PLAYER_OPTION_NAMES = ["", "Scissors", "Rock", "Paper"];
