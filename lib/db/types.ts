export type TimeVote = {
  id: string;
  day: string;
  hour: number;
  vote_count: number;
  created_at: string;
  updated_at: string;
};

export type TimeSlotWithVotes = {
  day: string;
  time: string;
  utcTime: string;
  hour: number;
  utcDay: string;
  utcHour: number;
  voteCount: number;
  selected: boolean;
};
