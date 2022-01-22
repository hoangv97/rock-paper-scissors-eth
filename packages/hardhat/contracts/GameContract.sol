// SPDX-License-Identifier: MIT
pragma solidity ^0.8.10;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract GameContract {
    uint256 constant SCISSORS = 1;
    uint256 constant ROCK = 2;
    uint256 constant PAPER = 3;

    enum RESULT_TYPE {
        UNDECIDED,
        WIN_1,
        DRAW,
        WIN_2
    }

    enum ROOM_STATUS {
        EMPTY,
        ONE_PERSON,
        FULL,
        PLAYED
    }

    struct Room {
        uint256 id;
        address address_1;
        address address_2;
        uint256 betAmount;
        ROOM_STATUS status;
        RESULT_TYPE result;
        //Token will be used in the room
        string token;
        // Player's option in hashcode
        bytes32 hashcode_1;
        bytes32 hashcode_2;
        // Player's option in number (rock, scissors, paper), set after sending secret key
        // if choose = 0 => player haven't sent secret key
        uint256 choose_1;
        uint256 choose_2;
        // Check if a player sent secret key or not
        bool[2] checks;
    }

    struct Currency {
        address addressToken;
        string symbol;
    }

    uint256 public feeRatePercentage;

    mapping(string => address) listToken;

    // Array include list of token using in game
    Currency[] public arrCurrency;

    Room[] public rooms;

    // Keep track of opened room number
    uint256 public roomNumber;

    // Check number of opening rooms (1 person)
    uint256 public openingRoomNumber;

    // Check if someone is already a owner of a opening room or not
    // If they were, stop them from opening a new one
    mapping(address => uint256) public ownerCount;

    // Check number of rooms a player has joined
    mapping(address => uint256) public playerRoomsCount;

    event CreateRoom(Room _room);
    event JoinRoom(Room _room);
    event MakeResult(Room _room);
    event Withdraw(Room _room, address _player);

    address owner;

    constructor(uint256 _feeRatePercentage) {
        owner = msg.sender;
        feeRatePercentage = _feeRatePercentage;
    }

    //Check balance of contract corresponding to each token
    function balance(string memory _token) public view returns (uint256) {
        if (sha256(bytes(_token)) == sha256(bytes(""))) {
            return address(this).balance;
        } else {
            return ERC20(listToken[_token]).balanceOf(address(this));
        }
    }

    //Add token in game
    function addCurrency(address _addressToken) public {
        require(msg.sender == owner, "You are not allowed");
        string memory _symbol = ERC20(_addressToken).symbol();
        arrCurrency.push(Currency(_addressToken, _symbol));
        listToken[_symbol] = _addressToken;
    }

    function getCurrencies() public view returns (Currency[] memory) {
        return arrCurrency;
    }

    // Check number of opening room
    function getOpeningRooms() public view returns (Room[] memory) {
        Room[] memory results = new Room[](openingRoomNumber);
        uint256 rid = 0;
        for (uint256 i; i < roomNumber; i++) {
            if (rooms[i].status == ROOM_STATUS.ONE_PERSON) {
                results[rid] = rooms[i];
                rid += 1;
            }
        }
        return results;
    }

    function getPlayerRooms(address _player)
        public
        view
        returns (Room[] memory)
    {
        uint256 count = playerRoomsCount[_player];
        Room[] memory results = new Room[](count);
        uint256 rid = 0;
        for (uint256 i; i < roomNumber; i++) {
            if (
                rooms[i].address_1 == _player || rooms[i].address_2 == _player
            ) {
                results[rid] = rooms[i];
                rid += 1;
            }
        }
        return results;
    }

    // Send bet amount to create a room
    function createRoom(string memory _token) public payable {
        require(
            ownerCount[msg.sender] <= 10,
            "You have already reached to limit."
        );

        require(msg.value > 0, "Bet amount must greater than 0");

        checkValidToken(_token, msg.value);

        Room memory room;
        room.id = roomNumber;
        room.status = ROOM_STATUS.ONE_PERSON;
        room.address_1 = msg.sender;
        room.betAmount = msg.value;
        room.token = _token;

        rooms.push(room);

        ownerCount[msg.sender] += 1;
        playerRoomsCount[msg.sender] += 1;
        openingRoomNumber += 1;
        roomNumber += 1;

        emit CreateRoom(room);
    }

    // Player send option here to join a room
    function sendHashcode(uint256 _id, bytes32 _hashcode) public payable {
        Room storage room = rooms[_id];
        // With room owner: Only send option if room is full (after other player sent hashcode)
        if (room.address_1 == msg.sender) {
            require(room.status == ROOM_STATUS.FULL, "Room is unavailable");
            require(
                !room.checks[1],
                "You can not send hashcode after the second player have already secret code"
            );
            room.hashcode_1 = _hashcode;
        }
        // With guest player: Only send option if room has one person
        else {
            require(
                !room.checks[0],
                "You can not send hashcode after room owner have already secret code"
            );
            require(
                room.status == ROOM_STATUS.ONE_PERSON,
                "Room is unavailable"
            );

            require(
                msg.value == room.betAmount,
                "You must bet equal in the first 1"
            );

            checkValidToken(room.token, room.betAmount);

            room.status = ROOM_STATUS.FULL;
            room.hashcode_2 = _hashcode;
            room.address_2 = msg.sender;

            playerRoomsCount[msg.sender] = playerRoomsCount[msg.sender] + 1;

            openingRoomNumber -= 1;

            emit JoinRoom(room);
        }
    }

    // Hàm rút tiền . Một trong 2 người chơi đều có quyền rút tiền khi 1 trong 2 chưa gửi key bí mật lên hợp đồng.
    // Nếu chủ phòng là người rút thì tiền cược 2 người chơi sẽ về lại tài khoản của họ và phòng trở về trạng thái available
    // Nếu người chơi 2 rút tiền thì họ sẽ nhận lại tiền và phòng trở về trạng thái 1.
    function withdraw(uint256 _id) public payable {
        Room storage room = rooms[_id];
        require(
            msg.sender == room.address_1 || msg.sender == room.address_2,
            "You are not players in this room"
        );
        require(!room.checks[0] && !room.checks[0], "You can not withdraw");

        uint256 withdrawAmountMinusFee = (room.betAmount / 100) *
            (100 - feeRatePercentage);

        if (msg.sender == room.address_1) {
            transferToken(room.address_1, room.token, withdrawAmountMinusFee);

            if (room.status == ROOM_STATUS.FULL) {
                // If this room has 2 players, send money back to both of them
                transferToken(
                    room.address_2,
                    room.token,
                    withdrawAmountMinusFee
                );
            } else if (room.status == ROOM_STATUS.ONE_PERSON) {
                openingRoomNumber -= 1;
            }

            room.status = ROOM_STATUS.EMPTY;
            ownerCount[msg.sender] -= 1;
        } else if (msg.sender == room.address_2) {
            room.status = ROOM_STATUS.ONE_PERSON;
            openingRoomNumber += 1;

            // Delete player 2 data in this room
            room.address_2 = address(0);
            room.hashcode_2 = "";

            transferToken(room.address_2, room.token, withdrawAmountMinusFee);

            playerRoomsCount[msg.sender] = playerRoomsCount[msg.sender] - 1;
        }

        emit Withdraw(room, msg.sender);
    }

    // After both players sent hashcode, continue by sending secret code
    function sendSecret(uint256 _id, string memory _secretCode) public payable {
        Room storage room = rooms[_id];
        require(room.status == ROOM_STATUS.FULL, "Room is unavailable");

        // Find sender's option by secret key
        if (msg.sender == room.address_1) {
            uint256 choose = getPlayerOption(_secretCode, room.hashcode_1);
            require(choose > 0, "the first secret code is wrong");
            room.checks[0] = true;
            room.choose_1 = choose;
        } else if (msg.sender == room.address_2) {
            require(
                room.hashcode_1 != "",
                "Player 1 haven't sent option. Please wait."
            );
            uint256 choose = getPlayerOption(_secretCode, room.hashcode_2);
            require(choose > 0, "the second secret code is wrong");
            room.checks[1] = true;
            room.choose_2 = choose;
        }

        // If both players sent secret key, make result and send money to winner
        if (room.checks[0] && room.checks[1]) {
            room.result = getResult(room.choose_1, room.choose_2);
            room.status = ROOM_STATUS.PLAYED;
            ownerCount[room.address_1] = 0;

            uint256 betAmountMinusFee = ((room.betAmount * 2) / 100) *
                (100 - feeRatePercentage);

            if (room.result == RESULT_TYPE.DRAW) {
                transferToken(
                    room.address_1,
                    room.token,
                    betAmountMinusFee / 2
                );
                transferToken(
                    room.address_2,
                    room.token,
                    betAmountMinusFee / 2
                );
            } else if (room.result == RESULT_TYPE.WIN_1) {
                transferToken(room.address_1, room.token, betAmountMinusFee);
            } else if (room.result == RESULT_TYPE.WIN_2) {
                transferToken(room.address_2, room.token, betAmountMinusFee);
            }

            emit MakeResult(room);
        }
    }

    function checkValidToken(string memory _token, uint256 _amount) private {
        if (sha256(bytes(_token)) != sha256(bytes(""))) {
            require(listToken[_token] != address(0), "Token is invalid");
            require(
                ERC20(listToken[_token]).allowance(msg.sender, address(this)) ==
                    _amount,
                "You must call approve first in web3"
            );
            require(
                ERC20(listToken[_token]).transferFrom(
                    msg.sender,
                    address(this),
                    _amount
                ),
                "Transfer failed"
            );
        }
    }

    function transferToken(
        address _address,
        string memory _tokenSymbol,
        uint256 _amount
    ) private {
        if (sha256(bytes(_tokenSymbol)) == sha256(bytes(""))) {
            payable(_address).transfer(_amount);
        } else {
            ERC20(listToken[_tokenSymbol]).transfer(_address, _amount);
        }
    }

    /**
    Pure functions
    **/
    function getResult(uint256 _choose_1, uint256 _choose_2)
        private
        pure
        returns (RESULT_TYPE result)
    {
        if (_choose_1 == SCISSORS && _choose_2 == ROCK) {
            return RESULT_TYPE.WIN_2;
        }

        if (_choose_1 == SCISSORS && _choose_2 == PAPER) {
            return RESULT_TYPE.WIN_1;
        }

        if (_choose_1 == SCISSORS && _choose_2 == SCISSORS) {
            return RESULT_TYPE.DRAW;
        }

        if (_choose_1 == ROCK && _choose_2 == SCISSORS) {
            return RESULT_TYPE.WIN_1;
        }

        if (_choose_1 == ROCK && _choose_2 == PAPER) {
            return RESULT_TYPE.WIN_2;
        }

        if (_choose_1 == ROCK && _choose_2 == ROCK) {
            return RESULT_TYPE.DRAW;
        }

        if (_choose_1 == PAPER && _choose_2 == SCISSORS) {
            return RESULT_TYPE.WIN_2;
        }

        if (_choose_1 == PAPER && _choose_2 == PAPER) {
            return RESULT_TYPE.DRAW;
        }

        if (_choose_1 == PAPER && _choose_2 == ROCK) {
            return RESULT_TYPE.WIN_1;
        }
    }

    function getPlayerOption(string memory _secretCode, bytes32 _hashcode)
        private
        pure
        returns (uint256)
    {
        if (getHashcode(_secretCode, SCISSORS) == _hashcode) {
            return SCISSORS;
        }
        if (getHashcode(_secretCode, ROCK) == _hashcode) {
            return ROCK;
        }
        if (getHashcode(_secretCode, PAPER) == _hashcode) {
            return PAPER;
        }
        return 0;
    }

    function getHashcode(string memory _secretCode, uint256 _option)
        public
        pure
        returns (bytes32)
    {
        return
            sha256(bytes.concat(bytes(_secretCode), bytes(uint2str(_option))));
    }

    function uint2str(uint256 _i) internal pure returns (string memory str) {
        if (_i == 0) {
            return "0";
        }
        uint256 j = _i;
        uint256 length;
        while (j != 0) {
            length++;
            j /= 10;
        }
        bytes memory bstr = new bytes(length);
        uint256 k = length;
        j = _i;
        while (j != 0) {
            bstr[--k] = bytes1(uint8(48 + (j % 10)));
            j /= 10;
        }
        str = string(bstr);
        return str;
    }
}
