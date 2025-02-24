FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app
EXPOSE 8080

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
ARG BUILD_CONFIGURATION=Release
WORKDIR /src
COPY ["PracticeGrading.API/PracticeGrading.API.csproj", "PracticeGrading.API/"]
COPY ["PracticeGrading.Data/PracticeGrading.Data.csproj", "PracticeGrading.Data/"]
RUN dotnet restore "PracticeGrading.API/PracticeGrading.API.csproj"
COPY . .
WORKDIR "/src/PracticeGrading.API"
RUN dotnet build "PracticeGrading.API.csproj" -c $BUILD_CONFIGURATION -o /app/build

FROM build AS publish
ARG BUILD_CONFIGURATION=Release
RUN dotnet publish "PracticeGrading.API.csproj" -c $BUILD_CONFIGURATION -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "PracticeGrading.API.dll"]
