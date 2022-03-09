import { createLogger, format, Logger, transports } from "winston";

export const logger: Logger = createLogger(
    {
        format: format.combine(
            format.timestamp(),
            format.simple()
        ),
        transports: [
            new transports.Console, // by default logs won't be saved
            // new transports.File({
            //     filename: './test.log'
            // })
        ]
    }
)