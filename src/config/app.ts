import express from 'express';

export const configureApp = (app: express.Application) => {
    app.use(express.json());
};

