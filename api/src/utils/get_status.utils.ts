export const getStatus = (isShort: boolean, publishAt?: Date | string) => {
    const publishHour = 18;
    const publishMinute = 16;

    // monta data de hoje às 18:16
    const now = new Date();
    const publishAtDate = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        publishHour,
        publishMinute,
        0
    );

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