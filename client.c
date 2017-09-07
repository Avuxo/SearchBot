#include <stdio.h>
#include <sys/socket.h>
#include <string.h>
#include <arpa/inet.h>
#include <unistd.h>
#include <stdlib.h>

char *parseArgs(int argc, char **argv);
char *createPacket(int argc, char **args);
int sendPacket(char *packet);
int isInt(char *argv);

int main(int argc, char **argv){
    if(argc < 2){
        fprintf(stderr, "USAGE: client <arguments>\n");
        return 1;
    }

    char *packet = parseArgs(argc, argv); /*args for packet creation*/

    if(sendPacket(packet) != 0){
        fprintf(stderr, "ERROR: Unabe to send packet\n");
        return 1;
    }
    
    return 0;
}

char *parseArgs(int argc, char **argv) {
    char **arguments = malloc(argc * sizeof(char));

    /*loop through argv and find arguments*/
    int argumentCounter = 0;
    for(int i=1; i<argc; i++, argumentCounter++) { /*j is counter for arguments*/
        if(strcmp(argv[i], "-h") == 0) { /*display program help*/
            printf("Help:\n-h -- help\n-g -- specify guild <guildID>\n-l -- list guilds\n-r -- rate flag\n");
            free(arguments);
            exit(0);
        } else if(strcmp(argv[i], "-g") == 0) { /*change guild*/
            if((argc >= i) && (isInt(argv[i+1]))){
                arguments[argumentCounter] = "-g";
                arguments[argumentCounter+1] = argv[i+1];
                argumentCounter++;
                i++; /*increment past the argument <guildID>*/
            } else {
                fprintf(stderr, "ERROR: -g requires a number argument\n");
                exit(1);
            }
        } else if(strcmp(argv[i], "-l") == 0) { /*list guilds*/
            arguments[argumentCounter] = "-l";
        } else if (strcmp(argv[i], "-r") == 0){
            arguments[argumentCounter] = "-r";
        } else { /*unknown command*/
            fprintf(stderr, "ERROR: unknown command: %s\n", argv[i]);
            exit(1);
        }
    }
    char *packet = createPacket(argumentCounter, arguments);
    free(arguments);

    return packet;
}

/*createPacket
  creates a TCP packet based on given arguments.
  creates in a JSON object
*/
char *createPacket(int argc, char **arguments){
    /*allocate 100 characters for each argument*/
    char *packet = malloc(sizeof(char) * argc * 100);
    
    for(int i=0; i<argc; i++){
        if(strlen(arguments[i]) > 99){ /*ensure that argument is not > 100 (+\0)*/
            fprintf(stderr,
                    "ERROR: Argument \"%s\" exceeds maximum lenght of 99\n",
                    arguments[i]);
            exit(1);
        }
        
        if(strcmp(arguments[i], "-g") == 0){ /*arguments are santitized in caller*/
            sprintf(packet + strlen(packet), "\"guild\":%s", arguments[i+1]);
            i++; /*skip over argument*/
        } else if(strcmp(arguments[i], "-l") == 0) {
             /*listGuild is an independent packet, no args*/
            packet = "\"listGuild\":1";
        } else if (strcmp(arguments[i], "-r") == 0){
            sprintf(packet + strlen(packet), "\"rateUsers\":1");
        } else {
            fprintf(stderr,
                    "ERROR: Unknown argument supplied %s\n",
                    arguments[i]);
            exit(1);
        }
        if(!(i >= argc-1)){
            sprintf(packet + strlen(packet), ",");
        }
    }
    printf("%s\n", packet);
    return packet;
}

int sendPacket(char *packet){
    char *res; /*buffers*/
    int sock; /*socket*/
    struct sockaddr_in server;

    sock = socket(AF_INET, SOCK_STREAM, 0); /*initialize socket*/
    if(sock == -1){
        fprintf(stderr, "ERROR: Could not create socket\n");
        return 1;
    }

    /*configure server struct for connection*/
    server.sin_addr.s_addr = inet_addr("127.0.0.1");
    server.sin_family = AF_INET;
    server.sin_port = htons(8187);

    /*connect to server*/
    if(connect(sock, (struct sockaddr *)&server, sizeof(server)) < 0) {
        fprintf(stderr, "ERROR: Connection to server failed\n");
        return 1;
    }

    res = malloc(sizeof(char) * 1000); /*allocate response buffer*/
    
    if(send(sock, packet, strlen(packet), 0) < 0){ /*send packet to daemon*/
        fprintf(stderr, "ERROR: Contacting bot daemon failed\n");
        return 1;
    }
    
    if(recv(sock, res, 1000, 0) < 0){ /*receive response from daemon*/
        fprintf(stderr, "Failed to receive response from bot daemon\n");
        return 1;
    }

    printf("%s\n", res);
        
    close(sock);
    free(res);
    return 0;
}

/*
  Check if input string is an integer
  0 - not an int
  1 - is an int
*/
int isInt(char *arg){
    char *ints = "1234567890"; /*list of possible ints*/
    for(int i=0; i<strlen(arg); i++){
        for(int j=0; j<10; j++){
            if(arg[i] == ints[j]){
                return 1;
            }
        }
    }
    return 0;
}
