export const getStatus = (isShort: boolean, publishAt?: Date | string) => {
    const publishHour = 20;
    const publishMinute = 0;

    const now = new Date();
    let publishAtDate: Date;

    if (publishAt) {
        publishAtDate = new Date(publishAt);
    } else {
        // Default: Today at 20:00 BRT
        publishAtDate = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate(),
            publishHour,
            publishMinute,
            0
        );

        // If current time is past 20:00, schedule for tomorrow
        if (now >= publishAtDate) {
            publishAtDate.setDate(publishAtDate.getDate() + 1);
        }
    }

    const status: any = {
        madeForKids: false,
        selfDeclaredMadeForKids: false
    };

    if (isShort) {
        status.privacyStatus = "public"; // Shorts: público imediato
    } else {
        status.privacyStatus = "private"; // Vídeo longo: fica privado até o horário
        status.publishAt = publishAtDate.toISOString(); // Agenda
    }

    return status;
}
