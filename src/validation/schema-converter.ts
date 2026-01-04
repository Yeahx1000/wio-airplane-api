import { zodToJsonSchema } from 'zod-to-json-schema';
import { z } from 'zod';

export const zodToFastifySchema = (schema: z.ZodTypeAny): Record<string, unknown> => {
    const jsonSchema = zodToJsonSchema(schema as any, {
        target: 'openApi3',
        $refStrategy: 'none',
    }) as Record<string, unknown>;

    return jsonSchema;
};

