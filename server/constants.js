export const STEPS = {
        UNSTARTED: 'Mission non démarrée',
        GIVE_SIDE_INSIDE: 'Main du donneur dans la boîte',
        OBJECT_DROPPED: 'Objet déposé',
        TAKE_SIDE_INSIDE: 'Main du receveur dans la boîte',
        COMPLETED: 'Mission réussie',
        FAILED: 'Mission échouée',
        // etape quand la mission a échoué et que l'objet est toujours dans la boîte
        FAILED_OBJECT_STILL_INSIDE: "Mission échouée, objet toujours dans la boîte"
};

export const FAILED_REASONS = {
        BOTH_SIDES_INSIDE: "Les deux mains sont dans la boîte",
        WRONG_OBJECT: "Mauvais objet déposé",
};

export const LED_COLORS = {
        RED:        [255, 0, 0],
        GREEN:      [0, 255, 0],
        BLUE:       [0, 0, 255],
        LIGHT_BLUE: [0, 255, 255],
        YELLOW:     [255, 255, 0],
        PURPLE:     [255, 0, 255],
        OFF:        [0, 0, 0]
};

export const PATROLS_MODES = {
        PATROLLING : 'patrolling',
        HOLDING : 'holding',
        // ALERT : 'alert'
};

export const OBJECTS = [
        {
                id:'C:3C:70:6',
                name: "la bouteille de lait",
                key: 'lait'
        },
        {
                id:'C:3C:70:6',
                name: "le fusil",
                key: 'fusil'
        },
        {
                id:'C:3C:70:6',
                name: "la boîte d'oeufs",
                key: 'oeufs'
        },
        {
                id:'C:3C:70:6',
                name: "la paire de chaussures",
                key: 'chaussures'
        }
]