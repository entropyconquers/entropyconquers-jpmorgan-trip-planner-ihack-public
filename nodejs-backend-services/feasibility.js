
const feasibilityEnum = Object.freeze({
  FEASIBLE: 1,
  NOT_FEASIBLE: 2,
  TRAIN: 3,
  FLIGHT: 4,
});
const geocoder = require("node-geocoder");

const options = {
  provider: "openstreetmap",
};

const geocode = geocoder(options);


const distance = (city1_lat, city1_long, city2_lat, city2_long) => {
  const radlat1 = (Math.PI * city1_lat) / 180;
  const radlat2 = (Math.PI * city2_lat) / 180;
  const theta = city1_long - city2_long;
  const radtheta = (Math.PI * theta) / 180;
  let dist =
    Math.sin(radlat1) * Math.sin(radlat2) +
    Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
  dist = Math.acos(dist);
  dist = (dist * 180) / Math.PI;
  dist = dist * 60 * 1.1515;
  return dist;
};

async function isTripFeasible(
  budget,
  number_of_people,
  num_days,
  city1,
  city2
) {
    //convert budget to int
    budget = parseInt(budget);
  let location1 = await geocode.geocode(city1);
  let city1_lat = location1[0].latitude,
    city1_long = location1[0].longitude;

  let location2 = await geocode.geocode(city2);
  let city2_lat = location2[0].latitude,
    city2_long = location2[0].longitude;

  const cost_of_train_per_km_india = 1.41;
  const cost_per_user_train =
    cost_of_train_per_km_india *
    distance(city1_lat, city1_long, city2_lat, city2_long);

  const avg_cheap_hotel_per_person_india = 850;
  const avg_mid_hotel_per_person_india = 1700;
  const avg_expensive_hotel_per_person_india = 3000;
  let hotel_price_final_per_use = avg_cheap_hotel_per_person_india;

  const avg_use_cost = budget / (num_days * number_of_people);
  if (avg_use_cost > 0 && avg_use_cost < 5000) {
    hotel_price_final_per_use = avg_cheap_hotel_per_person_india;
  } else if (avg_use_cost >= 5000 && avg_use_cost < 10000) {
    hotel_price_final_per_use = avg_mid_hotel_per_person_india;
  } else {
    hotel_price_final_per_use = avg_expensive_hotel_per_person_india;
  }

  const avg_food_cost_per_day_per_user = 800;
  const total_price =
    ((avg_food_cost_per_day_per_user + hotel_price_final_per_use) * num_days +
      cost_per_user_train * 2) *
    number_of_people;
  const value = Math.round(budget - total_price);

  const flight_price_per_person =
    4.25 * distance(city1_lat, city1_long, city2_lat, city2_long);
  const total_price_flight =
    ((avg_food_cost_per_day_per_user + hotel_price_final_per_use) * num_days +
      flight_price_per_person * 2) *
    number_of_people;
  const new_value = budget - total_price_flight;
  let result = {
    status: "",
    min_budget: 0,
    travel_mode: "",
  };
  if (value < budget * 0.1) {
    result.status = "NOT_FEASIBLE";
    //calculate min budget required to make it feasible
    let new_budget = budget;
    let v = new_budget - total_price;
    while (v < new_budget * 0.1) {
        new_budget += 100;
        v = new_budget - total_price;
    }
    result.min_budget = new_budget;
    result.travel_mode = "TRAIN";
    return result;
  } else if (budget * 0.1 < value && value < budget * 0.2) {
    //return feasibilityEnum.TRAIN;
    const avg_train_speed = 40; //km/hr
    const dis = distance(city1_lat, city1_long, city2_lat, city2_long);
    const time = dis / avg_train_speed;
    //total trip time
    const total_trip_time = num_days * 24;
    console.log(time * 2, total_trip_time * 0.8);
    if (time * 2 > total_trip_time * 0.8) {
        result.status = "NOT_FEASIBLE";
        //calculate min budget required to make it feasible by flight
        let new_budget = budget;
        let v = new_budget - total_price_flight;
        while (v < new_budget * 0.1) {
            new_budget += 100;
            v = new_budget - total_price_flight;
        }
        result.min_budget = new_budget;
        result.travel_mode = "FLIGHT";
        return result;
    }


    result.status = "FEASIBLE";
    result.travel_mode = "TRAIN";
    result.min_budget = budget;
    return result;
  } else if (value > budget * 0.22 && new_value > budget * 0.08) {
    //return feasibilityEnum.FLIGHT;
    result.status = "FEASIBLE";
    result.travel_mode = "FLIGHT";
    result.min_budget = budget;
    return result;
  } else {
    //return feasibilityEnum.FEASIBLE;
    result.status = "FEASIBLE";
    result.travel_mode = "ANY";
    result.min_budget = budget;
    return result;
  }
}

module.exports = isTripFeasible;
