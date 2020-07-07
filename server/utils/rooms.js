const fs = require('fs');
const saveRoomFileName = "./public" + '//rooms-data.json';

class Rooms {
    constructor (){
    }

    addRoom (room) {
        var rooms = this.getRoomList();
        var room = {
            roomValue: this.lowerCaseRoom(room),
            displayText: room
            
        }
        rooms.push(room);
        this.saveRooms(rooms);
        return room;
    }

    removeRoom (room) {
        var room = this.getRoom(room);
        var rooms = this.getRoomList().filter((v) => v.roomValue !== room.roomValue);
        this.saveRooms(rooms);
        return room;
    }

    getRoom (room) {
        var rooms = this.getRoomList();
        return rooms.filter((v) => v.roomValue === room)[0];
    }

    checkRoomExist (room) {
        var roomArray  = this.getRoomList().filter((v) => v.roomValue == room);
        if(roomArray.length > 0){
            return true;
        }
        return false;
    }

    getRoomList () {
        try{
            var roomsString = fs.readFileSync(saveRoomFileName);
            return JSON.parse(roomsString);
        }catch(error){
            return [];
        }
    }

    saveRooms (rooms) {
        fs.writeFileSync(saveRoomFileName, JSON.stringify(rooms));
    }

    lowerCaseRoom(stringRoom) {
        return stringRoom.toLowerCase();
    }
}

module.exports = { Rooms };