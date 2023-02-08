import { Flex, Heading, Image, Box, VStack, Button, HStack, Spacer, SimpleGrid, useDisclosure } from "@chakra-ui/react";
import {remark} from 'remark'
// @ts-ignore
import removeMd from 'remove-markdown'
import {
  Drawer,
  DrawerBody,
  DrawerFooter,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
} from '@chakra-ui/react'
//import Pill
import Pill from "../../components/Pill"
import { Textarea } from '@chakra-ui/react'
import {  Text } from '@chakra-ui/react'
import React, { useEffect, useState } from "react";
import { useAutoAnimate } from '@formkit/auto-animate/react'
import { useToast } from '@chakra-ui/react'
import {
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
} from '@chakra-ui/react'
// import keys.js from src root
// @ts-ignore
import {openai_keys} from "../../../keys"

// ChakraUI AlertDialog with header: Not Feasible, body: The trip is not feasible with the given parameters. Minimum budget required is ${data.min_budget} and mode of transport is ${data.travel_mode}
// @ts-ignore
function NotFeasibleAlert({isOpen, onClose, data}){
  if(!data) return null;
  return (
    <AlertDialog
      isOpen={isOpen}
      // @ts-ignore
      leastDestructiveRef={undefined}
      onClose={onClose}
    >
      <AlertDialogOverlay>
        <AlertDialogContent>
          <AlertDialogHeader fontSize="lg" fontWeight="bold">
            Not Feasible
          </AlertDialogHeader>

          <AlertDialogBody>
            The trip is not feasible with the given parameters. Minimum budget required is {data.min_budget} and mode of transport is {data.travel_mode}
          </AlertDialogBody>

          <AlertDialogFooter>
            <Button ref={undefined} onClick={onClose}>
              Close
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialogOverlay>
    </AlertDialog>
  )
}
// @ts-ignore
function FullLengthDrawer({data}){
  const { isOpen, onOpen, onClose } = useDisclosure()
  const btnRef = React.useRef()
  
  useEffect(() => {
    if(data){
      
      onOpen()
    }
  }, [data])

  if(!data) return null;
  return (
    <Drawer
      isOpen={isOpen}
      placement="bottom"
      onClose={onClose}
      size="xl"
    >
      <DrawerOverlay>
        <DrawerContent>
          <DrawerCloseButton
            color={"white"}
          />
          <DrawerHeader
            bg={"black"}
            color={"white"}
          >Here is your trip plan</DrawerHeader>
          <DrawerBody>
          
          {/* Data has new lines and other formattings (make sure they stay intact) */}
          <Text
            whiteSpace={"pre-line"}
          >
            {/*  @ts-ignore */}
            {data.split("\n").map((line, index) => {
              if(line.includes("Day") && !line.includes("budget")){
                return <Text my={2} p={4} bg="black" borderRadius={10} display={"inline-block"}  textColor={"white"}  fontWeight="bold">{line+"\n"}</Text>
              }
              if(line.includes("budget")){
                return <Text my={4} p={2} bg="gray" borderRadius={4} display={"inline-block"}  textColor={"white"}  fontWeight="body">{line}</Text>
              }
              if(line.includes("AM") || line.includes("PM") || line.includes("am") || line.includes("pm")){
                //find the index of the last AM or PM
                const index = line.lastIndexOf("AM") > line.lastIndexOf("PM") ? line.lastIndexOf("AM") : line.lastIndexOf("PM")
                const time = line.substring(0, index+2)
                const rest = line.substring(index+2)
                //make the time bold and the rest normal 
                return (
                  <Text bg="teal" my={4} p={4} color={"white"}>
                    <Text display={"inline-block"} fontWeight="bold">
                      {time}
                    </Text>
                    <Text display={"inline-block"}>{rest}</Text>
                  </Text>
                );
              }
              return <Text>{line}</Text>
            })}
            
            
          </Text>
          


          </DrawerBody>

          
        </DrawerContent>
      </DrawerOverlay>
    </Drawer>
  )
}


const Home = () => {
  const { isOpen, onOpen, onClose } = useDisclosure()
  const cancelRef = React.useRef()
  const btnRef = React.useRef()
  const [feasibilityData, setFeasibilityData] = useState<any>(null)
  const [tripPlan, setTripPlan] = useState<any>(null)
  const [prompt, setPrompt] = useState<string>("");
  const [generated, setGenerated] = useState<string>("CHAT:\nTRIP_PLANNER: Hi, I am Trip Planner. I can help you plan your trip. Please tell me your budget, origin, destination, total days, number of people, preferences and any other information you would like to share.");
  const [loading, setLoading] = useState<boolean>(false);
  const [moreInfoRequired, setMoreInfoRequired] = useState<string>("");
  const Toast = useToast()
  
  //response from server
  const [response, setResponse] = useState({
    "total_budget": null,
    "origin": null,
    "destination": null,
    "total_days": null,
    "no_of_person": null,
    "event_preferences": null,
    "misc_preferences": null
  });

  const fetchEvents = async (query:String) => {
    
    
    const res = await fetch(`https://jp-morgan-trip-planner-backend.onrender.com/fetchevents?query=${query}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });
    const data = await res.json()
    try{
      let result:any = {}
      
      let event_results = data.events_results
      let event_list = []
      for(let i=0; i<event_results.length; i++){
        //only get title, date.when
        let event:any = {}
        event["title"] = event_results[i].title
        event["date"] = event_results[i].date.when
        
        event_list.push(event)
        //if i > 2 then break
        if(i>2) break

      }
      result[`${query}`] = event_list
      return result
    }
    catch(err){
      return {}
    }
  }
  //useEffect to close all toast when tripPlan is generated
  useEffect(() => {
    if(tripPlan){
      Toast.closeAll()
    }
  }, [tripPlan])

  const generateTrip = async (hasEvents:boolean, events:any, travel_mode: string, response: any) => {
    // ChakraUI info Toast with label: Generating Trip
    //close all toasts
    setLoading(true)
    Toast.closeAll()
    Toast({
      title: "Generating Trip",
      description: "This may take a while... Please wait while we generate your trip",
      status: "info",
      duration: 30000,
      isClosable: true,
      
    })
    let inter = null
    //10 seconds timeout
    setTimeout(() => {
      Toast.closeAll()
      // 4 times 5 seconds interval
      let count = 0
      let interval = setInterval(() => {
        Toast.closeAll()
        if(count == 0){
          //toast matching events
          Toast({
            title: "Matching Events",
            description:
              "Matching events according to your travel timings and preferences",
            status: "info",
            duration: 10000,
            isClosable: true,
          });
        }
        else if(count == 1){
          //toast fetinng tourist attractions
          Toast({
            title: "Fetching Tourist Attractions",
            description: "Fetching tourist attractions at your destination",
            status: "info",
            duration: 10000,
            isClosable: true,
          });
        }
        else if(count == 2){
          //toast calculating budget and time constraints
          Toast({
            title: "Calculating Budget and Time Constraints",
            description:
              "Calculating budget and time constraints for your trip",
            status: "info",
            duration: 10000,
            isClosable: true,
          });
        }
        else if(count == 3){
          //toast bringing it all together
          Toast({
            title: "Bringing it all together",
            description: "Coagulating all the information to generate your trip",
            status: "success",
            duration: 10000,
            isClosable: true,
          });
        }
        count++
        if(count == 4){
          clearInterval(interval)
        }
      }, 10000)
      inter = interval

    }, 10000)

    let travel_data:any = response
    if(!travel_mode || travel_mode == "" || travel_mode == "ANY"){
      travel_data["travel_mode"] = "FLIGHT OR TRAIN"
    }
    else{
      travel_data["travel_mode"] = travel_mode
    }
    console.log("response", response)
    let query_text_no_events =
      `Plan a detailed ${response.total_days} day itinerary for ${response.no_of_person} people from ${response.origin} to ${response.destination} with total trip budget (${response.total_days} days) : ${response.total_budget} Rupees \n` +

      `Make sure to include travelling to and fro in the budget and time constraints of the trip.\n` +
      "\n" +
      "Make sure to include timestamps and estimated budget of every activity.\n" +
      "\n" +
      `Make sure to include famous tourist attractions of ${response.destination} in the trip.\n` +
      
      "Make sure to include breakfast, lunch and dinner everyday.\n" +
      "\n" +
      `Make sure to be mindful about the travel time by ${travel_data["travel_mode"]} between origin and destination.\n` +
      "\n" +
      "Make sure to strictly adhere to the budget mentioned.\n";

    let query_text_events =
      `Plan a detailed ${response.total_days} day itinerary for ${response.no_of_person} people from ${response.origin} to ${response.destination} with total trip budget (${response.total_days} days) : ${response.total_budget} Rupees \n` +
      `Make sure to include travelling to and fro in the budget and time constraints of the trip.\n` +
      "\n" +
      "Make sure to include timestamps and estimated budget of every activity.\n" +
      "\n" +
      `Make sure to include famous tourist attractions of ${response.destination} in the trip.\n` +
      "Make sure to include breakfast, lunch and dinner everyday.\n" +
      "\n" +
      `Make sure to be mindful about the travel time by ${travel_data["travel_mode"]} between origin and destination.\n` +
      "\n" +
      "Make sure to strictly adhere to the budget mentioned.\n" +
      "Make sure to also include events during the trip by using the following events_data\n" +
      "\n" +
      "events_data = " +
      JSON.stringify(events);

    let query_text = hasEvents ? query_text_events : query_text_no_events
    query_text += `\nGenerated Itinerary (2500 words):\n`
    /*const res = await fetch(`https://jp-morgan-trip-planner-backend.onrender.com/generatetrip?text=${query_text}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });*/
    const res = await fetch(`https://api.openai.com/v1/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${openai_keys[Math.floor(Math.random() * openai_keys.length)]}`,
      },
      body: JSON.stringify({
        prompt: query_text,
        max_tokens: 2800,
        temperature: 0.5,
        top_p: 1,
        frequency_penalty: 0.0,
        presence_penalty: 0.0,
        model: "text-davinci-003",
      }),
    });

    try{
      let data = await res.json()
      data = data.choices[0].text
      if(data.length > 100){
        setTripPlan(data)
        console.log("trip plan", data)
        // ChakraUI success Toast with label: Trip Generated
        Toast.closeAll()
        if(inter){
          try{
            clearInterval(inter)
          }
          catch(err){
            console.log(err)
          }
        }
        Toast({
          title: "Trip Generated",
          
          status: "success",
          duration: 5000,
          isClosable: true,
        })
        setLoading(false)

       
  
      }
      else{
        Toast({
          title: "Error",
          description: "There was an error while generating your trip. Please try again.",
          status: "error",
          duration: 5000,
          isClosable: true,
        })
      }
      setLoading(false)

      console.log(data)
    }
    catch(err){
      // ChakraUI error Toast with label: Error
      Toast({
        title: "Error",
        description: "There was an error while generating your trip. Please try again.",
        status: "error",
        duration: 5000,
        isClosable: true,
      })
      console.log(err)
      setLoading(false)
    }
    
  }

  const checkFeasilbility = async (obj:any) => {
    // ChakraUI info Toast with label: Checking Feasibility
    Toast({
      title: "Checking Feasibility",
      description: "Please wait while the Model checks the feasibility of your trip.",
      status: "info",
      duration: 5000,
      isClosable: true,
    })
    const response = obj;
    //Sample request: https://jp-morgan-trip-planner-backend.onrender.com/feasibility?budget=23800&number_of_people=4&num_days=2&city1=Mumbai&city2=Delhi
    const res = await fetch(`https://jp-morgan-trip-planner-backend.onrender.com/feasibility?budget=${response.total_budget}&number_of_people=${response.no_of_person}&num_days=${response.total_days}&city1=${response.origin}&city2=${response.destination}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });
    const data = await res.json()
    console.log(data)
    if(data.status == "NOT_FEASIBLE"){
      //show alert
      setFeasibilityData(data)
      onOpen()
      
    } 
    else{
      //toast success Feasible
      // ChakraUI success Toast with label: Feasible
      Toast({
        title: "Feasible",
        description: "The trip is feasible with the given parameters.",
        status: "success",
        duration: 5000,
        isClosable: true,
      })
      // fetchEvents(`${response.event_preferences} events ${response.destination}`, "9a7937263635fe4d608f6ea7faa5c954bdc7491a201be7905771b57ae4f7cda2")
      if(response.event_preferences){
        // Toast with label: Fetching Events and description: Looking for events based on your preferences and destination.
        Toast({
          title: "Fetching Events",
          description: "Looking for events based on your preferences and destination.",
          status: "info",
          duration: 10000,
          isClosable: true,
        })
        //map response.event_preferences and fetch events for each [event_preferences is an array]
        let events_data:any = []
        /*await response.event_preferences.forEach(async (event:string) => {
          const event_data = await fetchEvents(`${event} events ${response.destination}`)
          events_data.push(event_data)
        })*/
        //convert the above loop to for await of loop
        for await (const event of response.event_preferences){
          const event_data = await fetchEvents(`${event} events ${response.destination}`)
          events_data.push(event_data)
        }
        console.log(events_data)
        //generate trip
        generateTrip(true, events_data, data.travel_mode, obj)
      }
      else{
        //generate trip
        generateTrip(false, {}, data.travel_mode, obj)
      }
    }
  }

  const sendPrompt = async () => {
    //ChakraUI info Toast with label: Processing Natural Language Query and description: Please wait while the Model analyzes your query and extracts the required parameters.
    Toast({
      title: "Processing Natural Language Query",
      description: "Please wait while the Model analyzes your query and extracts the required parameters.",
      status: "info",
      duration: 5000,
      isClosable: true,
    })

    //show toast


    setLoading(true);
    let text = "";
    if(prompt.length == 0) return;

    text = generated;
    text += "\nUSER: " + prompt + "\n"
    let output = text
    output += 'schema={\n'+
'      total_budget: TYPE (required): (Number, Total budget of the trip for all the people and total days | null if not available),\n'+
'      origin: TYPE (required) : (String, where the trip starts | null if not provided),\n'+
'      destination: TYPE (required) : (String, to where the trip is planned | null if not provided),\n'+
'      total_days: TYPE (required): (Number | null if not provided),\n'+
'      no_of_person: TYPE (required): Number,\n'+
'      event_preferences: TYPE (optional): (Array of Strings),\n'+
'      misc_preferences: TYPE (optional): (Array of Strings),\n'+
'      prompt_required: TYPE: (Boolean, false if all the required parameters are non null, true if some of the parameters are null)\n'+
'      prompt: TYPE: (String, If one or more of the parameters from total_budget, origin, destination, total_days or no_of_person are not provided by the USER during the CHAT, generate a response as TRIP_PLANNER asking for the parameters.),\n'+
'    }\n'+
'    Your response should only be in valid JSON format (using the above JSON schema), do not write any other extra text above or below the JSON'+
'';
    
    const res = await fetch(`https://jp-morgan-trip-planner-backend.onrender.com/predict?text=${output}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      
    });
    //get status code
    const status = await res.status
    if(status != 200) {
      Toast({
        title: "Error",
        description: "There was an error processing your query. Please try again after some time.",
        status: "error",
        duration: 5000,
        isClosable: true,
      })
      setLoading(false);
      return;
    }
    //strip markdown from response text
    const dataMD = await res.text()
    console.log(removeMd(dataMD))
    const data = JSON.parse(removeMd(dataMD).replace('```', '').replace('`', ''))
    text += "TRIP_PLANNER: " + data['prompt']
    setGenerated(text);
    let obj = {
      "total_budget": data['total_budget'],
      "origin": data['origin'],
      "destination": data['destination'],
      "total_days": data['total_days'],
      "no_of_person": data['no_of_person'],
      "event_preferences": data['event_preferences'],
      "misc_preferences": data['misc_preferences'],
      "misc": data['misc']
    }
    setResponse(obj)
    if(data['prompt'] != null && data['prompt'].length > 0) {
      setMoreInfoRequired(data['prompt'])
      setPrompt("")
    }
    console.log(data)
    setLoading(false);
    //if all the required parameters are non null, then call checkFeasilbility
    if(obj.total_budget != null && obj.origin != null && obj.destination != null && obj.total_days != null && obj.no_of_person != null) {
      checkFeasilbility(obj)
    }
  }
  const [parent, enableAnimations] = useAutoAnimate(/* optional config */)
  return (
    <VStack justifyContent="center" alignItems="center" height="100vh">
      <Image
        src="/assets/bg.jpg"
        alt="Background"
        position="absolute"
        width="100%"
        height="100%"
        objectFit="cover"
        zIndex="-1"
      />
      <Heading
        color="white"
        fontSize="2xl"
        pos={"absolute"}
        bottom={"20px"}
        left={"20px"}
      >
        Tripped.
      </Heading>
      <Box pos={"absolute"} bottom={"20px"} right={"20px"}>
        <Pill>iHack Demo</Pill>
      </Box>
      <VStack
        spacing={6}
        p={8}
        bg="#FFFFFF30"
        borderRadius={"30"}
        backdropFilter="blur(20px)"
        width={"60%"}
      >
        <Heading color="black" fontSize="2xl">
          {moreInfoRequired.length > 0
            ? "Please provide more info"
            : "Trip Planner"}
        </Heading>
        {/* Input textarea with hint text */}
        <Textarea
          placeholder={
            moreInfoRequired.length > 0
              ? moreInfoRequired
              : "Include budget, no. of days, no. of people, origin, destination in your query. \nExample: 3 day Trip to Mumbai from Jaipur with a budget of 36000 rs for 2 people. Also plan for good music and sports events in the trip."
          }
          size="lg"
          color="black"
          bg="#FFFFFF"
          fontSize={"sm"}
          borderRadius={"10"}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          //disable resize
          resize="none"
          //disable spellcheck
          //disable border focus
          _focus={{
            border: "none",
          }}
        ></Textarea>
        <HStack w={"100%"}>
          <Spacer />
          <Button
            colorScheme="blackAlpha"
            size="lg"
            borderRadius={"10"}
            onClick={() => sendPrompt()}
            isLoading={loading}
          >
            Generate
          </Button>
        </HStack>
      </VStack>
      <SimpleGrid
        p={8}
        minChildWidth="200px"
        spacing="20px"
        width={"90%"}
        ref={parent}
      >
        {Object.keys(response).map((key) => {
          // @ts-ignore
          if (response[key] != null) {
            return (
              <Pill key={key}>
                <Text
                  display={"inline-block"}
                  
                >
                  {/* @ts-ignore */}
                  {key}: {response[key]}
                </Text>
                
              </Pill>
            );
          }
          return null;
        })}
      </SimpleGrid>
      {/* Not Feasibile alert */}
      <NotFeasibleAlert
        isOpen={isOpen}
        onClose={onClose}
        data={feasibilityData}
      ></NotFeasibleAlert>
      <FullLengthDrawer
       
        data={tripPlan}
      ></FullLengthDrawer>

    </VStack>
  );
};

export default Home;
