import { createHmac } from 'crypto';

const keyId = 'eyJvcmciOiI2NDM4MGYxNGFkZGJiYTAwMDE4MWYwMTEiLCJpZCI6IjRiMzhkZDI5Y2MyODRiYjA5OGEwNjljZmMwMmI1ZmM4IiwiaCI6Im11cm11cjEyOCJ9'
const secret = 'NDY3NjU3ZTgxYjAxNGZjYjlhYzcxOTllOGYyMGJiYmY='

interface VehicleInfo {
  make: string;
  model: string;
  series: string;
  body: string;
  modelYear: number;
  combinedMSRP: number;
  powertrain: string;
  weight: string;
  horsepower: number;
}

export async function getVehicleInfo(vin: string): Promise<VehicleInfo> {
  const date = new Date().toUTCString();
  const signatureContentString = 'date: ' + date;
  const hmac = createHmac('sha1', secret);
  hmac.update(signatureContentString);
  const signatureString = hmac.digest('base64');
  const encodedSignature = encodeURIComponent(signatureString);
  const authtoken = `Signature keyId="${keyId}",algorithm="hmac-sha1",signature="${encodedSignature}"`;

  let url = `https://cvd-api.jdpower.com/CVD/v1.0/vin/${vin}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'Authtoken': authtoken,
      'Date': date,
      'Accept-Encoding': 'gzip',
    },
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status} - ${await response.text()}`);
  }

  const data = await response.json() as { error: boolean, message: string, result: any };
  if (data.error) {
    throw new Error(data.message);
  }

  const result = data.result;

  return {make: result.make, model: result.model, series:result.vehicles[0]?.trim, body:result.vehicles[0]?.bodyType, modelYear:result.year, combinedMSRP:result.buildMSRP || result.estimatedMSRP || (result.vehicles[0]?.baseMSRP + result.vehicles[0]?.destinationCharge) || 0, powertrain:result.vehicles[0]?.driveType || 'N/A', weight:result.vehicles[0]?.standardCurbWeight || result.vehicles[0]?.standardGVWR || 'N/A', horsepower:parseInt(result.techSpecs[0]?.unitsOfMeasureAndValues?.value || '0', 10)}
  //{make:'Chevrolet', model:'Camaro', series:'ZL1', body:'Coupe', year:2024, modelYear:2024, msrp:60000, powertrain:'V8', gvwr: 5000, horsepower: 650},
  return result

  // Extract requested fields (adjust paths if response structure varies slightly)
  const make = result.make || 'N/A';
  const model = result.model || 'N/A';
  const series = result.vehicles[0]?.trim || 'N/A'; // Trim often represents series; confirm in your response
  const body = result.vehicles[0]?.bodyType || 'N/A';
  const modelYear = result.year || 0;
  const combinedMSRP = result.buildMSRP || result.estimatedMSRP || (result.vehicles[0]?.baseMSRP + result.vehicles[0]?.destinationCharge) || 0;

  // Powertrain: Combine from vehicles and techSpecs
  let engine = '';
  let transmission = '';
  let horsepower = 0;
  console.log("weight", result.vehicles, result.vehicles[0]?.standardCurbWeight)
  let weight = result.vehicles[0]?.standardCurbWeight || result.vehicles[0]?.standardGVWR || 'N/A';

  (result.techSpecs || []).forEach((spec: any) => {
    const desc = spec.description?.toLowerCase() || '';
    if (desc.includes('engine')) engine = spec.nameNoBrand || spec.name || '';
    if (desc.includes('transmission')) transmission = spec.nameNoBrand || spec.name || '';
    if (desc.includes('horsepower')) {
      horsepower = parseInt(spec.unitsOfMeasureAndValues?.value || '0', 10);
    }
  });

  const powertrain = `${result.vehicles[0]?.driveType || ''} ${engine} ${transmission}`.trim() || 'N/A';



  return {
    make,
    model,
    series,
    body,
    modelYear,
    combinedMSRP,
    powertrain,
    weight,
    horsepower,
  };
}