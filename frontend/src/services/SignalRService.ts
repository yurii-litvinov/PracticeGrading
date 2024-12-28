import * as signalR from '@microsoft/signalr';

export class SignalRService {
    private connection: signalR.HubConnection | null = null;
    private meetingId: string;
    private onNotificationReceived: (message: string) => void;

    constructor(meetingId: string, onNotificationReceived: (message: string) => void) {
        this.meetingId = meetingId;
        this.onNotificationReceived = onNotificationReceived;
    }

    public startConnection = async () => {
        this.connection = new signalR.HubConnectionBuilder()
            .withUrl(`${import.meta.env.VITE_API_URL}/meetingHub`)
            .build();

        this.connection.on("ReceiveNotification", (action: string) => {
            this.onNotificationReceived(action);
        });

        try {
            await this.connection.start();
            await this.joinMeetingGroup();
        } catch (err) {
            console.error("Error while starting connection: ", err);
            setTimeout(() => this.startConnection(), 5000);
        }
    };

    public stopConnection = async () => {
        if (this.connection) {
            await this.leaveMeetingGroup();
            await this.connection.stop();
        }
    };

    public sendNotification = async (action: string) => {
        if (this.connection?.state === signalR.HubConnectionState.Connected) {
            try {
                await this.connection.invoke("NotifyMembers", this.meetingId, action);
            } catch (err) {
                console.error("Error while sending notification: ", err);
            }
        } else {
            setTimeout(() => this.sendNotification(action), 5000);
        }
    };

    private joinMeetingGroup = async () => {
        if (this.connection?.state === signalR.HubConnectionState.Connected) {
            try {
                await this.connection.invoke("JoinMeetingGroup", this.meetingId);
            } catch (err) {
                console.error("Error while joining meeting group: ", err);
            }
        } else {
            console.error("Connection is not established.");
        }
    };

    private leaveMeetingGroup = async () => {
        if (this.connection?.state === signalR.HubConnectionState.Connected) {
            try {
                await this.connection.invoke("LeaveMeetingGroup", this.meetingId);
            } catch (err) {
                console.error("Error while leaving meeting group: ", err);
            }
        } else {
            console.error("Connection is not established.");
        }
    };
}
