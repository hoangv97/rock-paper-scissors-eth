import { useEventListener } from "eth-hooks/events/useEventListener";
import { List } from "antd";
import Address from "../Address";

const Events = ({ address, readContracts, localProvider, mainnetProvider }) => {

  const joinRoomEvents = useEventListener(readContracts, "GameContract", "JoinRoom", localProvider, 1);
  const withdrawEvents = useEventListener(readContracts, "GameContract", "Withdraw", localProvider, 1);

  const events = [...(joinRoomEvents || [])]
    .concat([...(withdrawEvents || [])])
    .filter(item => item.args[0].address_1 === address || item.args[0].address_2 === address);

  events.sort((a, b) => {
    const _a = a.args[0].id.toNumber();
    const _b = b.args[0].id.toNumber();
    return _a === _b ? 0 : _a < _b ? 1 : -1;
  });

  return (
    <>
      <h2>Events</h2>
      <List
        style={{ height: 200, overflow: "scroll", margin: "0 auto", width: 500 }}
        dataSource={events}
        renderItem={item => {
          // console.log(item)
          return (
            <List.Item key={item.blockNumber + item.blockHash}>
              {item.event === "JoinRoom" && (
                <div>
                  <Address value={item.args[0].address_2} fontSize={16} /> joined room {item.args[0].id.toNumber()}
                </div>
              )}
              {item.event === "Withdraw" && (
                <div>
                  <Address value={item.args[1]} fontSize={16} /> withdrew in room {item.args[0].id.toNumber()}
                </div>
              )}
            </List.Item>
          );
        }}
      />
    </>
  )
}

export default Events