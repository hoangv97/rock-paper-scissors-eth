import { useState } from "react";
import { useContractReader } from "eth-hooks";
import { Layout } from "antd";
import RoomModal from "./RoomModal";
import NewRoomModal from "./NewRoomModal";
import RoomList from "./RoomList";
import GameEvents from "./Events";

const { Content } = Layout;

const Game = ({ tx, readContracts, writeContracts, address, localProvider, mainnetProvider }) => {
  const [roomModalVisible, setRoomModalVisible] = useState(false);
  const [roomModalId, setRoomModalId] = useState(-1);

  const [newModalVisible, setNewModalVisible] = useState(false);

  const openingRooms = useContractReader(readContracts, "GameContract", "getOpeningRooms");
  const playerRooms = useContractReader(readContracts, "GameContract", "getPlayerRooms", [address]);

  return (
    <>
      <Content style={{ maxWidth: 1000, margin: "0 auto" }}>
        <div style={{ margin: "20px" }}>
          <NewRoomModal
            tx={tx}
            writeContracts={writeContracts}
            readContracts={readContracts}
            localProvider={localProvider}
            mainnetProvider={mainnetProvider}
            address={address}
            visible={newModalVisible}
            setVisible={setNewModalVisible}
          />
        </div>
        {roomModalVisible && roomModalId >= 0 && (
          <RoomModal
            tx={tx}
            writeContracts={writeContracts}
            readContracts={readContracts}
            address={address}
            visible={roomModalVisible}
            setVisible={setRoomModalVisible}
            id={roomModalId}
          />
        )}
        <GameEvents
          address={address}
          readContracts={readContracts}
          localProvider={localProvider}
          mainnetProvider={mainnetProvider}
        />
        <RoomList
          title={"Opening Rooms"}
          data={openingRooms}
          address={address}
          setRoomModalId={setRoomModalId}
          setRoomModalVisible={setRoomModalVisible}
        />
        <RoomList
          title={"My Rooms"}
          data={playerRooms}
          address={address}
          setRoomModalId={setRoomModalId}
          setRoomModalVisible={setRoomModalVisible}
        />
      </Content>
    </>
  )
}

export default Game;
