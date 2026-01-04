export type AppData = {
  count: number;
  lastUpdated: number;
  version: number;
};

export type Recipe = {
  description: string;
  ingredients: Ingredient[];
  people_served: number;
  steps: Step[];
  times_cooked: number;
  title: string;
  author?: string;
  last_cooked_on?: Date;
  tags?: string[];
};

type Ingredient = {
  amount: number | "to taste";
  name: string;
  unit?: string;
};

type Step = {
  description: string;
  order: number;
};
