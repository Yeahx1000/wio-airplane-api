// the following package was deprecated as of Nov 2025
import { zodToJsonSchema } from 'zod-to-json-schema';
// good from here 
import { z } from 'zod';

export const zodToFastifySchema = (schema: z.ZodTypeAny): Record<string, unknown> => {
    const jsonSchema = zodToJsonSchema(schema as any, {
        target: 'openApi3',
        $refStrategy: 'none',
    }) as Record<string, unknown>;

    return jsonSchema;
};

