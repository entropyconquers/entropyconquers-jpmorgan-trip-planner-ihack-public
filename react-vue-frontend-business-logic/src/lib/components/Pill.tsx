import React from 'react'
import { Flex, Text } from '@chakra-ui/react'
export default function Pill(props: any) {
    return (
      <Flex 
          bg="#FFFFFF50"
          borderRadius={"20"}
          px={4}
          py={1}
          //background-blur
            backdropFilter="blur(2px)"
          color="black"
          >
             <Text
              //semi-bold
              fontWeight="500"
                fontSize="sm"
                noOfLines={1}
             >
                  {props.children}
              </Text>
          </Flex>
    )
  }
