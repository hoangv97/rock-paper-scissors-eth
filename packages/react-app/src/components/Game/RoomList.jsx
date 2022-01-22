import { Button, Table, Tag, Space } from "antd";
import { utils } from "ethers";
import { useState, useEffect } from "react";
import Address from "../Address";
import { ROOM_STATUS } from "../../helpers/consts";

const RoomList = ({ title, data, address, setRoomModalId, setRoomModalVisible }) => {
  const [rooms, setRooms] = useState(data);

  useEffect(() => {
    if (data) {
      const _rooms = [...data];
      _rooms.sort((a, b) => (a.id.toNumber() < b.id.toNumber() ? 1 : -1));
      setRooms(_rooms);
    }
  }, [data]);

  const tableColumns = [
    {
      title: "Room",
      dataIndex: "id",
      key: "id",
      render: val => val.toNumber(),
      sorter: (a, b) => (a.id.toNumber() > b.id.toNumber() ? 1 : -1),
    },
    {
      title: "Owner",
      dataIndex: "address_1",
      key: "address_1",
      render: val => <Address value={val} fontSize={16} />
    },
    {
      title: "Token",
      dataIndex: "token",
      key: "token",
      render: val => <Tag color="cyan">{val === "" ? "ETH" : val}</Tag>,
    },
    {
      title: "Bet Amount",
      dataIndex: "betAmount",
      key: "betAmount",
      render: (val, record) => {
        return record.token === "" ? utils.formatEther(val) : val.toNumber();
      },
      sorter: (a, b) => (a.betAmount > b.betAmount ? 1 : -1),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: val => {
        switch (val) {
          case ROOM_STATUS.EMPTY:
            return <Tag color="geekblue">Empty</Tag>;
          case ROOM_STATUS.ONE_PLAYER:
            return <Tag color="green">1 Player</Tag>;
          case ROOM_STATUS.TWO_PLAYERS:
            return <Tag color="red">2 Players</Tag>;
          case ROOM_STATUS.CLOSED:
            return <Tag color="orange">Closed</Tag>;
          default:
            return "";
        }
      },
    },
    {
      title: "Actions",
      key: "actions",
      render: (text, record) => {
        if (record.status === ROOM_STATUS.ONE_PLAYER || address === record.address_1 || address === record.address_2) {
          return (
            <Space size="middle">
              <Button
                type="primary"
                onClick={() => {
                  setRoomModalId(record.id.toNumber());
                  setRoomModalVisible(true);
                }}
              >
                Open
              </Button>
            </Space>
          );
        }
        return "";
      },
    },
  ];

  return (
    <>
      <h2>{title}</h2>
      <Table columns={tableColumns} dataSource={rooms} />
    </>
  )
}

export default RoomList;
