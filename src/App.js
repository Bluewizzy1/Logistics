import React, { useState } from "react";
import { DragDropContext, Draggable, Droppable } from "react-beautiful-dnd";
import styled from "styled-components";

const Container = styled.div`
  display: flex;
  justify-content: space-between;
  margin: 2em;
`;

const QueueContainer = styled.div`
  margin-right: 2em;
  max-width: 300px;
`;

const PlannerContainer = styled.div`
  width: 100%;
`;

const PlannerTable = styled.table`
  width: 100%;
  border-collapse: collapse;
`;

const PlannerCell = styled.td`
  border: 1px solid #ddd;
  padding: 8px;
  height: 150px;
  width: 200px;
`;

const DATASET = {
  customers: [
    {
      id: "customer-1",
      name: "Customer A",
      pickup: "Location A",
      dropoff: "Location B",
    },
    {
      id: "customer-2",
      name: "Customer B",
      pickup: "Location C",
      dropoff: "Location D",
    },
    {
      id: "customer-3",
      name: "Customer C",
      pickup: "Location C",
      dropoff: "Location D",
    },
    {
      id: "customer-4",
      name: "Customer D",
      pickup: "Location C",
      dropoff: "Location D",
    },
  ],
  planner: {
    slots: ["Slot 1", "Slot 2", "Slot 3", "Slot 4"],
    days: 7,
    schedule: {},
  },
};

function App() {
  const [customers, setCustomers] = useState(DATASET.customers);
  const [planner, setPlanner] = useState(DATASET.planner);

  const onDragEnd = (result) => {
    const { source, destination } = result;

    if (!destination) {
      return;
    }

    if (
      source.droppableId === "droppable" &&
      destination.droppableId === "droppable"
    ) {
      // Move from logistics queue to logistics queue
      const newCustomers = Array.from(customers);
      const [removed] = newCustomers.splice(source.index, 1);
      newCustomers.splice(destination.index, 0, removed);
      setCustomers(newCustomers);
    } else if (
      source.droppableId === "droppable" &&
      destination.droppableId !== "droppable"
    ) {
      // Move from logistics queue to planner
      const dayIndex = parseInt(destination.droppableId, 10);
      const slotIndex = destination.index;

      const newSchedule = { ...planner.schedule };
      if (!newSchedule[dayIndex]) {
        newSchedule[dayIndex] = {};
      }
      newSchedule[dayIndex][slotIndex] = customers[source.index].id;

      // Remove the dragged customer from the logistics queue
      const newCustomers = [...customers];
      newCustomers.splice(source.index, 1);
      setCustomers(newCustomers);

      setPlanner((prevPlanner) => ({
        ...prevPlanner,
        schedule: newSchedule,
      }));

      // Save the updated planner to the database
      saveToDatabase(newSchedule);
    } else if (
      source.droppableId !== "droppable" &&
      destination.droppableId !== "droppable"
    ) {
      // Reorder within the planner
      const sourceDayIndex = parseInt(source.droppableId, 10);
      const sourceSlotIndex = source.index;
      const destinationDayIndex = parseInt(destination.droppableId, 10);
      const destinationSlotIndex = destination.index;

      const newSchedule = { ...planner.schedule };

      // Remove the item from the source
      const removedCustomerId = newSchedule[sourceDayIndex][sourceSlotIndex];
      delete newSchedule[sourceDayIndex][sourceSlotIndex];

      // If the source slot is now empty, remove the day entry
      if (Object.keys(newSchedule[sourceDayIndex]).length === 0) {
        delete newSchedule[sourceDayIndex];
      }

      // Add the item to the destination
      if (!newSchedule[destinationDayIndex]) {
        newSchedule[destinationDayIndex] = {};
      }
      newSchedule[destinationDayIndex][destinationSlotIndex] = removedCustomerId;

      setPlanner((prevPlanner) => ({
        ...prevPlanner,
        schedule: newSchedule,
      }));

      // Save the updated planner to the database
      saveToDatabase(newSchedule);
    }
  };

  const saveToDatabase = (data) => {
    // Replace this with actual logic to save data to the backend
    console.log("Saving to database:", data);
  };

  return (
    <Container>
      <DragDropContext onDragEnd={onDragEnd}>
        <QueueContainer>
          <Droppable droppableId="droppable" type="customer">
            {(provided, snapshot) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                style={{
                  width: "220px",
                  padding: "10px",
                }}
              >
                <h2>Logistics Queue</h2>
                {customers.map((customer, index) => (
                  <Draggable
                    key={customer.id}
                    draggableId={customer.id}
                    index={index}
                  >
                    {(provided) => (
                      <div
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        ref={provided.innerRef}
                      >
                        <CustomerCard customer={customer} />
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </QueueContainer>

        <PlannerContainer>
          <h2>Planner</h2>
          {[...Array(planner.days)].map((_, dayIndex) => (
            <Droppable
              key={dayIndex}
              droppableId={`${dayIndex}`}
              direction="horizontal"
              type="customer"
            >
              {(provided) => (
                <PlannerTable
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                >
                  <thead>
                    <tr>
                      <th style={{ width: "150px" }}>Date</th>
                      {planner.slots.map((slot, slotIndex) => (
                        <th key={slotIndex}>{slot}</th>
                      ))}
                    </tr>
                  </thead>
                  <PlannerRow
                    dayIndex={dayIndex}
                    dataset={DATASET}
                    planner={planner}
                  />
                </PlannerTable>
              )}
            </Droppable>
          ))}
        </PlannerContainer>
      </DragDropContext>
    </Container>
  );
}

const PlannerRow = ({ dayIndex, dataset, planner }) => {
  const day = new Date();
  day.setDate(day.getDate() + dayIndex);

  return (
    <Droppable droppableId={`${dayIndex}`} type="customer">
      {(provided) => (
        <tbody ref={provided.innerRef} {...provided.droppableProps}>
          <tr>
            <PlannerCell>{day.toDateString()}</PlannerCell>
            {planner.slots.map((slot, slotIndex) => (
              <PlannerCell key={slotIndex}>
                {planner.schedule[dayIndex]?.[slotIndex] && (
                  <Draggable
                    draggableId={planner.schedule[dayIndex][slotIndex]}
                    index={0}
                  >
                    {(provided) => (
                      <div
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        ref={provided.innerRef}
                      >
                        <CustomerCard
                          customer={dataset.customers.find(
                            (c) =>
                              c.id === planner.schedule[dayIndex][slotIndex]
                          )}
                        />
                      </div>
                    )}
                  </Draggable>
                )}
              </PlannerCell>
            ))}
          </tr>
        </tbody>
      )}
    </Droppable>
  );
};


const CustomerCard = ({ customer }) => (
  <div
    style={{
      border: "1px solid #ddd",
      padding: "2px 8px",
      marginBottom: "8px",
      width: "180px",
    }}
  >
    <strong>{customer.name}</strong>
    <p>Pick Up: {customer.pickup}</p>
    <p>Drop Off: {customer.dropoff}</p>
  </div>
);

export default App;
